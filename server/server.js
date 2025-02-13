"use strict";

const express = require("express");
const morgan = require("morgan");
const { check, query, validationResult } = require("express-validator");
const path = require("path");

const spgDao = require("./spgDao");
const passport = require("passport"); // auth middleware
const LocalStrategy = require("passport-local").Strategy; // username and password for login
const session = require("express-session"); // enable sessions
const userDao = require("./userDao"); // module for accessing the users in the DB
const dao = require("./db"); // module for accessing the users in the DB
const url = require("url");
const dayjs = require("dayjs");

/*** Set up Passport ***/
// set up the "username and password" login strategy
// by setting a function to verify username and password
passport.use(
  new LocalStrategy(function (username, password, done) {
    userDao.getUser(username, password).then((user) => {
      if (!user)
        return done(null, false, {
          message: "Incorrect username and/or password.",
        });

      return done(null, user);
    });
  })
);

// serialize and de-serialize the user (user object <-> session)
// we serialize the user id and we store it in the session: the session is very small in this way
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// starting from the data in the session, we extract the current (logged-in) user
passport.deserializeUser((id, done) => {
  userDao
    .getUserById(id)
    .then((user) => {
      done(null, user); // this will be available in req.user
    })
    .catch((err) => {
      done(err, null);
    });
});

// init express
const app = new express();
const port = 3001;
app.use(morgan("dev"));
app.use(express.json()); // parse the body in JSON format => populate req.body attributes

// custom middleware: check if a given request is coming from an authenticated user
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();

  return res.status(401).json({ error: "not authenticated" });
};

// set up the session
app.use(
  session({
    // by default, Passport uses a MemoryStore to keep track of the sessions
    secret:
      "a secret sentence not to share with anybody and anywhere, used to sign the session ID cookie",
    resave: false,
    saveUninitialized: false,
  })
);

// then, init passport
app.use(passport.initialize());
app.use(passport.session());

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

/*** APIs ***/

// GET products
app.get("/api/products", async (req, res) => {
  try {
    const products = await spgDao.getProducts();
    if (products.error) {
      res.status(404).json(products);
    } else {
      res.json(products);
    }
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
});

// GET clients
app.get("/api/clients", async (req, res) => {
  try {
    const clients = await spgDao.getClients();
    if (clients.error) {
      res.status(404).json(clients);
    } else {
      res.json(clients);
    }
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
});

// GET specific client
app.get("/api/clients/:id", async (req, res) => {
  try {
    const client = await spgDao.getClient(req.params.id);
    if (client.error) {
      res.status(404).json(client);
    } else {
      res.json(client);
    }
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
});

// POST /api/orders/
//new order
app.post("/api/orders/", async (req, res) => {
  const order = req.body;

  try {
    let flag = false;
    Object.entries(order.products).forEach(async (prod) => {
      const res = await spgDao.orderPrep(prod);
      if (!res) flag = true;
    });
    if (flag) return;
    order.id = await spgDao.getNextNumber();

    order.date = dayjs().format("YYYY-MM-DD");
    order.time = dayjs().format("HH:mm");
    order.products = JSON.stringify(order.products);
    const result = await spgDao.addOrder(order);
    if (result.err) res.status(404).json(result);
    else res.json(result);
  } catch (err) {
    res.status(500).json({ error: `${err}.` });
    return;
  }
});

// GET orders
app.get("/api/getorders", async (req, res) => {
  try {
    const orders = await spgDao.getOrders();
    if (orders.error) {
      res.status(404).json(orders);
    } else {
      res.json(orders);
    }
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
});

//update order
app.post("/api/updateOrder/:id", async (req, res) => {
  const id =req.params.id
  try {
    const result = await spgDao.updateOrder(id);
    if (result.err) res.status(404).json(result);
    else res.json(result);
  } catch (err) {
    res.status(500).json({ error: `${err}.` });
    return;
  }
});

/*** User APIs ***/

// POST /sessions
// login
app.post("/api/sessions", function (req, res, next) {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      // display wrong login messages
      console.log(user);
      return res.status(401).json(info);
    }
    // success, perform the login
    req.login(user, (err) => {
      if (err) return next(err);

      // req.user contains the authenticated user, we send all the user info back
      // this is coming from userDao.getUser()
      return res.json(req.user);
    });
  })(req, res, next);
});

// DELETE /sessions/current
// logout
app.delete("/api/sessions/current", (req, res) => {
  req.logout();
  res.status(200).end();
});

// GET /sessions/current
// check whether the user is logged in or not
app.get("/api/sessions/current", (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
  } else res.status(401).json({ error: "Unauthenticated user!" });
});
