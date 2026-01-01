const { queryParams } = require("../../../db/database");
const defaultModals = require("./defaultModals");

module.exports = async (client, type) => {
  let username = client.username
  const modalData = await client.queryParams(
    "SELECT modal FROM modals WHERE user_id = ? AND type = ?",
    [username, type]
  );

  if (modalData.length === 0) {
    return defaultModals[type];
  }

  const userModalConfig = JSON.parse(modalData[0].modal);
  const defaultModalConfig = defaultModals[type];


  return {
    title: userModalConfig.title || defaultModalConfig.title,
    setLabel: userModalConfig.setLabel || defaultModalConfig.setLabel,
    setPlaceholder: userModalConfig.setPlaceholder || defaultModalConfig.setPlaceholder,
    setStyle: userModalConfig.setStyle || defaultModalConfig.setStyle,
  };
};
