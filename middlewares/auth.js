import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];

    let decodeData = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decodeData?.id;

    next();
  } catch (error) {
    if (error.message.includes('jwt expired')) {
      return res.status(401).json({message:'Session expired.'})
    }
    console.log(error)
    res.status(500).json({message:"Internal Server Error"})
  }
};

export default auth;
