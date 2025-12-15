export const verifyHR = (req, res, next) => {
  if (req.user.role !== "hr") {
    return res.status(403).send({ message: "HR only" });
  }
  next();
};
