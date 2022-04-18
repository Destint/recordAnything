const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    let wishDoc = await db.collection('wish').where({
      _openid: wxContext.OPENID
    }).get();
    let wishList = wishDoc.data[0].wishList;
    wishList.unshift(event.wish);
    await db.collection('wish').where({
      _openid: wxContext.OPENID
    }).update({
      data: {
        wishList: _.unshift(event.wish)
      }
    })
    return {
      result: true,
      wishSum: wishList.length,
      partialWishList: wishList.slice(0, 15)
    }
  } catch (e) {
    return {
      result: false,
      errMsg: e
    }
  }
}