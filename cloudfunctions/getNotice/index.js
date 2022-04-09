const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    let noticeDoc = await db.collection('notice').where({
      _id: '8937eaa9613daffc0aa0e12b080c9859'
    }).get();
    if (noticeDoc.data[0]) {
      let noticeList = noticeDoc.data[0].noticeList;
      return {
        result: true,
        notice: noticeList[0].notice
      }
    } else {
      return {
        result: false
      }
    }
  } catch (e) {
    return {
      result: false,
      errMsg: e
    }
  }
}