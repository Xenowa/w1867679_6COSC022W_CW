"use strict";

const bidService = require("../services/bidService");

exports.showBidPage = async function (req, res, next) {
  try {
    const status = await bidService.getStatus(req.session.user.userId);
    res.render("bids/show", { status });
  } catch (err) {
    next(err);
  }
};

exports.placeBid = async function (req, res, next) {
  const amount = Number(req.body.amount);
  try {
    const result = await bidService.placeBid(req.session.user.userId, amount);
    res.message(result.error || "Bid placed.");
    res.redirect("/bids");
  } catch (err) {
    next(err);
  }
};

exports.updateBid = async function (req, res, next) {
  const amount = Number(req.body.amount);
  try {
    const result = await bidService.updateBid(
      req.session.user.userId,
      req.params.id,
      amount,
    );
    res.message(result.error || "Bid updated.");
    res.redirect("/bids");
  } catch (err) {
    next(err);
  }
};

exports.cancelBid = async function (req, res, next) {
  try {
    const result = await bidService.cancelBid(
      req.session.user.userId,
      req.params.id,
    );
    res.message(result.error || "Bid cancelled.");
    res.redirect("/bids");
  } catch (err) {
    next(err);
  }
};

exports.showHistory = async function (req, res, next) {
  try {
    const history = await bidService.getHistory(req.session.user.userId);
    res.render("bids/history", { history });
  } catch (err) {
    next(err);
  }
};
