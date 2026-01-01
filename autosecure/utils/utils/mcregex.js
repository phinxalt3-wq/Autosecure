function isvalidmc(username) {
    const pattern = /^[a-zA-Z0-9_]{3,16}$/;
    return typeof username === 'string' && pattern.test(username);
  }

  module.exports = isvalidmc;
  