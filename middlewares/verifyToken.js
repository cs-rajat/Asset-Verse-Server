import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).send({ message: "Unauthorized" });

  jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).send({ message: "Forbidden" });
    req.user = decoded;
    next();
  });
};
