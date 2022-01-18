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
      let memoirsDoc = await db.collection('memoirs').where({
        _openid: wxContext.OPENID
      }).get();
      if (!memoirsDoc.data[0]) {
        await db.collection('memory').add({
          data: {
            memoryList: [],
            _openid: wxContext.OPENID
          }
        });
        return {
          result: true,
          memoryList: []
        }
      } else {
        let memoryList = [];
        let memoirsData = memoirsDoc.data[0].memoirsData;
        for (let i = 0; i < memoirsData.length; i++) {
          memoryList[i] = {};
          memoryList[i]['id'] = new Date(memoirsData[i].time).getTime();
          memoryList[i]['title'] = memoirsData[i].title;
          memoryList[i]['content'] = memoirsData[i].content;
          memoryList[i]['localPicPathList'] = [];
          memoryList[i]['cloudPicPathList'] = memoirsData[i].pictureArray;
          memoryList[i]['date'] = memoirsData[i].time;
          memoryList[i]['address'] = memoirsData[i].detailedAddress;
          memoryList[i]['simpleAddress'] = memoirsData[i].address;
        }
        await db.collection('memory').add({
          data: {
            memoryList: memoryList,
            _openid: wxContext.OPENID
          }
        });
        return {
          result: true,
          memoryList: memoryList
        }
      }
    } else {
      return {
        result: true,
        memoryList: memoryDoc.data[0].memoryList
      }
    }
  } catch (e) {
    return {
      result: false,
      memoryList: [],
      errMsg: e
    }
  }
}