import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).send({ message: "Unauthorized - No Token" });

  const token = auth.split(" ")[1];
  if (!token) return res.status(401).send({ message: "Unauthorized - Invalid Token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).send({ message: "Forbidden - Invalid Signature" });
    req.user = decoded;
    next();
  });
};
