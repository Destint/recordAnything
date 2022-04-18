const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    let manageDoc = await db.collection('manage').where({
      _id: '6f49505e625cfa9e00999cae222c24b9'
    }).get();
    if (manageDoc.data[0]) {
      let manageList = manageDoc.data[0].manageList;
      let hasManagePermission = false;
      if (manageList.indexOf(wxContext.OPENID) !== -1) hasManagePermission = true;
      return {
        result: true,
        hasManagePermission: hasManagePermission
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