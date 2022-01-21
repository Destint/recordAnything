const cloud = require('wx-server-sdk');

cloud.init();

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    const data = await cloud.openapi.security.msgSecCheck({
      "openid": wxContext.OPENID,
      "scene": 1,
      "version": 2,
      "content": event.content
    })
    return {
      result: true,
      data: data
    }
  } catch (e) {
    return {
      result: false,
      errMsg: e
    }
  }
}