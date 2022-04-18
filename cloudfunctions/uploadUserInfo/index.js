const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    let userInfoDoc = await db.collection('userInfo').where({
      _openid: wxContext.OPENID
    }).get();
    let userInfoData = {};
    if (event.cloudAvatarPath) userInfoData['cloudAvatarPath'] = event.cloudAvatarPath;
    if (event.nickname) userInfoData['nickname'] = event.nickname;
    if (!userInfoDoc.data[0]) {
      await db.collection('userInfo').add({
        data: {
          userInfoData: userInfoData,
          _openid: wxContext.OPENID
        }
      });
    } else {
      await db.collection('userInfo').where({
        _openid: wxContext.OPENID
      }).update({
        data: {
          userInfoData: userInfoData
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