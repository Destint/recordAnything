const cloud = require('wx-server-sdk');

cloud.init();

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    return {
      result: true,
      openId: wxContext.OPENID,
      date: new Date().getTime()
    }
  } catch (e) {
    return {
      result: false,
      errMsg: e
    }
  }
}