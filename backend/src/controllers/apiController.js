import express from "express";

export const addMessage = async (req, res) => {
  res.status(200).json({ "message": `You said: ${req.body.message}` });
};
