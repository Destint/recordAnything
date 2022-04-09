const cloud = require('wx-server-sdk');

cloud.init();

exports.main = async (event, context) => {
  try {
    await cloud.deleteFile({
      fileList: event.cloudPicPathList
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