const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    let memoryDoc = await db.collection('memory').where({
      _openid: wxContext.OPENID
    }).get();
    let memoryList = memoryDoc.data[0].memoryList;
    let deleteMemoryIndex = memoryList.findIndex(function (object) {
      return object.id == event.memoryId;
    })

    if (memoryList[deleteMemoryIndex].cloudPicPathList.length !== 0) {
      await cloud.deleteFile({
        fileList: memoryList[deleteMemoryIndex].cloudPicPathList
      })
    }
    if (memoryList[deleteMemoryIndex].cloudRecordPath) {
      let cloudRecordList = [];
      cloudRecordList.push(memoryList[deleteMemoryIndex].cloudRecordPath);
      await cloud.deleteFile({
        fileList: cloudRecordList
      })
    }
    memoryList.splice(deleteMemoryIndex, 1);
    await db.collection('memory').where({
      _openid: wxContext.OPENID
    }).update({
      data: {
        memoryList: memoryList
      }
    })
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