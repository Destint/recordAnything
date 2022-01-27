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
      let praiseArray = praiseDoc.data[0].praiseArray;
      if (event.updateState) {
        if (praiseArray.indexOf(wxContext.OPENID) == -1) {
          await db.collection('praise').where({
            _id: '2d44d6c2613d99600bc2652a5a24293b'
          }).update({
            data: {
              praiseArray: _.unshift(wxContext.OPENID)
            }
          })
          return {
            result: true,
            praiseState: true,
            praiseSum: praiseArray.length + 1
          }
        } else {
          return {
            result: true,
            praiseState: true,
            praiseSum: praiseArray.length
          }
        }
      } else {
        return {
          result: true,
          praiseState: praiseArray.indexOf(wxContext.OPENID) != -1,
          praiseSum: praiseArray.length
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