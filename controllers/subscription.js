import { stripe } from "../index.js"
import User from "../models/auth.js";

const getAllPlans = async () => {
    try {
        const productList = await stripe.products.list()
        const activeProduct = productList.data.filter(product => product.active);
        const plans = await Promise.all(activeProduct.map(async (plan) => {
            const price = await stripe.prices.retrieve(plan.default_price);
            return {
                name: plan.name,
                description: plan.description,
                price: price.unit_amount / 100,
                duration: price.recurring.interval,
                planImageUrl: plan.images[0],
                priceId: plan.default_price
            }
        }))
        return plans
    } catch (error) {
        throw new Error(error.message)
    }
}

const createStripeCustomer = async (name, email) => {
    try {
        const customer = await stripe.customers.create({
            name, email
        })
        return customer.id;
    } catch (error) {
        return error
    }
}

const createCheckout = async (customerId, priceId) => {
    try {

        const session = await stripe.checkout.sessions.create({
            success_url: `${process.env.FRONTEND_URL}/subscription`,
            cancel_url: process.env.FRONTEND_URL,
            customer: customerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1
                }
            ],
            mode: 'subscription',
            expand: ['subscription']
        })
        return { url: session.url }

    } catch (error) {
        throw new Error(error.message)
    }
}

export const buyPlan = async (req, res) => {
    const userId = req.userId;
    const { priceId } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' })
        }
        const userStripeId = user.stripeId;
        console.log('userStripeId:=> ', userStripeId)
        if (!userStripeId) {
            console.log('generating new userStripeId...')
            user.stripeId = await createStripeCustomer(user.name, user.email)
            console.log('generated id: ', user.stripeId);
        }
        const userSubscription = await stripe.subscriptions.list({ customer: user.stripeId })

        if (userSubscription?.data[0]?.status === 'active') {
            return res.status(409).json({ message: 'User already have a subscription.' })
        }
        const { url } = await createCheckout(user.stripeId, priceId)
        await user.save();
        res.status(200).json({ url })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal Server Error." })
    }
}

export const cancelSubscription = async (req, res) => {
    const userId = req.userId;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        if (!user.activePlan) {
            return res.status(404).json({ message: "User don't have any active plan." });
        }
        await stripe.subscriptions.cancel(user.activePlan.subscriptionId)
        user.activePlan = null;
        await user.save();
        res.status(200).json({ message: 'Subscription cancelled' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error.' });
    }
}

export const getCustomer = async (req, res) => {
    const customerId = req.params.customerId;
    try {
        const customer = await stripe.customers.retrieve(customerId)
        res.status(200).json(customer);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error.' })
    }
}

export const getSubscription = async (req, res) => {
    const userId = req.userId;
    try {
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ message: 'User account not found.' });
        }
        if (user.activePlan) {
            return res.status(200).json({ message: `${user.activePlan.name} is Active `, activePlan: user.activePlan })
        }
        const customerId = user.stripeId
        if (!customerId) {
            const plans = await getAllPlans();
            return res.status(200).json({ message: "User have free plan.", plans });
        }
        const userSubscription = await stripe.subscriptions.list({ customer: customerId })
        const activeSubscription = userSubscription.data.find(subscription => subscription.status === 'active');

        if (!activeSubscription) {
            const plans = await getAllPlans();
            return res.status(200).json({ message: "User don't have any active plan.", plans });
        }
        const productId = activeSubscription.items.data[0].plan.product
        const plan = await stripe.products.retrieve(productId);
        const activePlan = {
            name: plan.name,
            description: plan.description,
            startDate: activeSubscription.start_date,
            planId: plan.id,
            price: (await stripe.prices.retrieve(plan.default_price)).unit_amount / 100,
            subscriptionId: activeSubscription.id,
            planImageUrl: plan.images[0]
        }
        user.activePlan = activePlan
        user.todayQuestionCount = 0;
        await user.save();
        res.status(200).json({ message: `${activePlan.name} is Active `, activePlan })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error.' })
    }
}

export const getProduct = async (req, res) => {
    const productId = req.params.productId;
    try {
        const product = await stripe.products.retrieve(productId)
        res.status(200).json({ product })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error.' });
    }
}


export const resetQuestionLimit = async (req, res) => {
    if (req.headers.authorization) {
        const credentials = Buffer.from(req.headers.authorization.split(' ')[1], 'base64').toString('utf-8');
        const [username, password] = credentials.split(':');
        if (username === process.env.CRON_USER && password === process.env.CRON_PASS) {
            try {
                await User.updateMany({}, {
                    $set: { todayQuestionCount: 0 }
                })
                return res.status(200).json({message:'Question limit reset successfully.'})
            } catch (error) {
                console.log(error)
                return res.status(500).json({message:"internal error"})
            }

        }
        res.status(409).json({message:'wrong username or password.'})
    }
    else{
        res.status(409).json({message:'Please provide auth header.'})
    }
    
}