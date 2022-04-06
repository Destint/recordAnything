const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    let memoryDoc = await db.collection('memory').where({
      _openid: wxContext.OPENID
    }).get();
    if (!memoryDoc.data[0]) {
      await db.collection('memory').add({
        data: {
          memoryList: [],
          _openid: wxContext.OPENID
        }
      });
      return {
        result: true,
        partialMemoryList: []
      }
    } else {
      let currentIndex = event.currentIndex ? event.currentIndex : 0;
      let partialMemoryList = memoryDoc.data[0].memoryList.slice(currentIndex, currentIndex + 20); // 每次只传索引值后的20条数据

      return {
        result: true,
        partialMemoryList: partialMemoryList,
        memorySum: memoryDoc.data[0].memoryList.length
      }
    }
  } catch (e) {
    return {
      result: false,
      partialMemoryList: [],
      errMsg: e
    }
  }
}