const NodeCache = require("node-cache");
const cache = new NodeCache({
  stdTTL: 300,
  checkperiod: 100,
});

module.exports = cache;
