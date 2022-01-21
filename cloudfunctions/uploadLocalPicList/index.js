const cloud = require('wx-server-sdk');

cloud.init();

const formatNumber = n => {
  n = n.toString();
  return n[1] ? n : `0${n}`;
}

function formatTime(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  const millisecond = date.getMilliseconds();

  return `${[year, month, day].map(formatNumber).join('-')} ${[hour, minute, second, millisecond].map(formatNumber).join(':')}`;
}

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    let uploadResult = await cloud.uploadFile({
      cloudPath: wxContext.OPENID + '/' + formatTime(new Date()),
      fileContent: Buffer.from(event.localPic, 'base64')
    })
    return {
      result: true,
      fileId: uploadResult.fileID
    }
  } catch (e) {
    return {
      result: false,
      errMsg: e
    }
  }
}