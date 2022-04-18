const cloud = require('wx-server-sdk');

cloud.init();

const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    let userInfoDoc = await db.collection('userInfo').where({
      _openid: wxContext.OPENID
    }).get();
    if (event.getUserInfoState == true && userInfoDoc.data[0].userInfoData) {
      return {
        result: true,
        userInfo: userInfoDoc.data[0].userInfoData
      }
    }
    if (!userInfoDoc.data[0]) {
      await db.collection('userInfo').add({
        data: {
          userInfoData: event.userInfoData,
          _openid: wxContext.OPENID
        }
      });
    } else {
      await db.collection('userInfo').where({
        _openid: wxContext.OPENID
      }).update({
        data: {
          userInfoData: event.userInfoData
        }
      })
    }
    return {
      result: true
    }
  } catch (e) {
    return {
      result: false,
      errMsg: e
    }
  }
}