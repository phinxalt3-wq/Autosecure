const { queryParams } = require("../../../db/database")

module.exports = async function getPreset(id, botnumber, name) {
  let preset = await queryParams(
    `SELECT * FROM presets WHERE user_id=? AND botnumber=? AND name=?`,
    [id, botnumber, name]
  )

  if (!preset || preset.length === 0) {
    return null
  }

  return preset[0].preset
}
