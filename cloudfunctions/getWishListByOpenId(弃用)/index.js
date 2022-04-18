const cloud = require('wx-server-sdk');

cloud.init();

const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    let wishDoc = await db.collection('wish').where({
      _openid: wxContext.OPENID
    }).get();
    if (!wishDoc.data[0]) {
      await db.collection('wish').add({
        data: {
          wishList: [],
          _openid: wxContext.OPENID
        }
      });
      return {
        result: true,
        wishList: []
      }
    } else {
      return {
        result: true,
        wishList: wishDoc.data[0].wishList
      }
    }
  } catch (e) {
    return {
      result: false,
      errMsg: e
    }
  }
}