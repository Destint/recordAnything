const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    let userInfoDoc = await db.collection('userInfo').where({
      _openid: wxContext.OPENID
    }).get();
    if (userInfoDoc.data[0]) {
      return {
        result: true,
        userInfo: userInfoDoc.data[0].userInfoData
      }
    } else {
      return {
        result: false
      }
    }
  } catch (e) {
    return {
      result: false,
      errMsg: e
    }
  }
}