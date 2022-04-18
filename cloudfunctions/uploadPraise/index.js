const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    let praiseDoc = await db.collection('praise').where({
      _id: '2d44d6c2613d99600bc2652a5a24293b'
    }).get();
    if (praiseDoc.data[0]) {
      let praiseList = praiseDoc.data[0].praiseList;
      if (praiseList.indexOf(wxContext.OPENID) === -1) {
        await db.collection('praise').where({
          _id: '2d44d6c2613d99600bc2652a5a24293b'
        }).update({
          data: {
            praiseList: _.unshift(wxContext.OPENID)
          }
        })
        return {
          result: true,
          praiseState: true,
          praiseSum: praiseList.length + 1
        }
      } else {
        return {
          result: true,
          praiseState: true,
          praiseSum: praiseList.length
        }
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