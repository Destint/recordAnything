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
        partialWishList: []
      }
    } else {
      let currentIndex = event.currentIndex ? event.currentIndex : 0;
      let partialWishList = wishDoc.data[0].wishList.slice(currentIndex, currentIndex + 15); // 每次只传索引值后的15条数据

      return {
        result: true,
        partialWishList: partialWishList,
        wishSum: wishDoc.data[0].wishList.length
      }
    }
  } catch (e) {
    return {
      result: false,
      partialWishList: [],
      errMsg: e
    }
  }
}