/**
 * Page: memory
 * Author: Trick
 * Date: 2022-01-17
 */
const app = getApp();
const QQMapWX = require('../../utils/qqmap-wx-jssdk.js'); // 获取当前位置
var qqmapsdk;

Page({
  /**
   * 页面的初始数据
   */
  data: {
    showPopup: false, // 是否显示弹出窗口(true可以防止弹窗穿透)
    noticeData: wx.getStorageSync('noticeData') ? wx.getStorageSync('noticeData') : '', // 公告栏数据(最多40个汉字,尽量20个以内)
    memorySum: wx.getStorageSync('memoryList') ? wx.getStorageSync('memoryList').length : 0, // 回忆总数
    memoryList: wx.getStorageSync('memoryList') ? wx.getStorageSync('memoryList') : [], // 回忆列表
    showMemoryInfo: false, // 是否显示回忆信息
    memoryInfo: {}, // 详细的回忆信息
    showAddMemory: false, // 是否显示添加回忆
    addMemory: {
      title: '',
      localPicPathList: [],
      content: '',
      cloudPicPathList: [],
      id: 0,
      date: '',
      address: '',
      simpleAddress: ''
    }, // 添加的回忆内容
  },

  recordMemoryState: false, // 记录回忆状态(防止两次点击记录回忆)
  sortState: false, // 排序状态

  /**
   * 页面创建时执行
   */
  async onLoad() {
    let that = this;
    wx.showShareMenu();
    qqmapsdk = new QQMapWX({
      key: '3XKBZ-WP4CG-KQVQM-IJ2WK-7QAE7-2ZFKZ' // 腾讯位置服务密钥
    })
    wx.showLoading({
      title: '载入回忆中',
      mask: true
    })
    await that.getMemoryListFromCloud();
    that.getNoticeDataFromCloud();
    wx.hideLoading();
  },

  /**
   * 页面出现在前台时执行
   */
  onShow() {},

  /**
   * 页面从前台变为后台时执行
   */
  onHide() {},

  /**
   * 页面被用户分享时执行
   */
  onShareAppMessage() {
    return {
      title: '回忆录-所记往事皆为回忆',
      path: '/pages/memory/memory',
      imageUrl: '/images/img_logo.png'
    };
  },

  /**
   * 触发下拉刷新时执行
   */
  onPullDownRefresh() {
    let that = this;
    that.getNoticeDataFromCloud();
    wx.stopPullDownRefresh();
  },

  /**
   * 点击回忆排序
   */
  onClickMemorySort() {
    let that = this;
    let memoryList = that.data.memoryList;
    that.sortState = !that.sortState;
    that.setData({
      memoryList: memoryList.reverse()
    })
  },

  /**
   * 点击回忆
   * @param {Object} e 点击事件的对象
   */
  onClickMemory(e) {
    let that = this;
    let memoryInfo = e.currentTarget.dataset.data; // 点击的回忆数据
    that.setData({
      showMemoryInfo: true,
      showPopup: true,
      memoryInfo: memoryInfo
    })
  },

  /**
   * 点击添加回忆
   */
  onClickAddMemory() {
    let that = this;
    that.setData({
      showPopup: true,
      showAddMemory: true
    })
  },

  /**
   * 点击编辑回忆
   * @param {Object} e 点击事件的对象
   */
  onClickEditorMemory(e) {
    let that = this;
    let memoryId = e.currentTarget.dataset.id; // 点击的回忆id
    let memoryTitle = e.currentTarget.dataset.title; // 点击的回忆标题
    wx.showActionSheet({
      itemList: ['删除该回忆'],
      success(res) {
        if (res.tapIndex == 0) that.deleteMemoryById(memoryId, memoryTitle);
      },
      fail(res) {
        // 点取消或空白处
      }
    })
  },

  /**
   * 从云端获取回忆列表
   */
  async getMemoryListFromCloud() {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'getMemoryListByOpenId',
        })
        .then(async (res) => {
          if (res.result && res.result.result) {
            await that.checkLocalPicPath(res.result.memoryList);
            resolve(true);
          } else {
            that.setData({
              memoryList: res.result.memoryList,
              memorySum: 0
            })
            resolve(false);
          }
        })
        .catch(error => {
          resolve(false);
        })
    });
    let result = await p;
    if (!result) that.showErrorTip();
  },

  /**
   * 检测本地图片路径是否存在
   * @param {Array} memoryList 回忆列表
   */
  async checkLocalPicPath(memoryList) {
    let that = this;
    let bigProArr = []; // 大循环promise
    let smallProArr = []; // 小循环promise
    let updateState = false; // 是否向云端更新回忆
    for (let i = 0; i < memoryList.length; i++) {
      bigProArr[i] = new Promise(async function (resolve, reject) {
        for (let j = 0; j < memoryList[i].cloudPicPathList.length; j++) {
          smallProArr[j] = new Promise(async function (resolve, reject) {
            if (memoryList[i].localPicPathList[j] == undefined) {
              await wx.cloud.downloadFile({
                  fileID: memoryList[i].cloudPicPathList[j]
                })
                .then(res => {
                  memoryList[i].localPicPathList[j] = res.tempFilePath;
                  updateState = true;
                  resolve(true);
                })
                .catch(res => {
                  resolve(true);
                })
            } else {
              await wx.getImageInfo({
                  src: memoryList[i].localPicPathList[j]
                })
                .then(res => {
                  resolve(true);
                })
                .catch(async (res) => {
                  await wx.cloud.downloadFile({
                      fileID: memoryList[i].cloudPicPathList[j]
                    })
                    .then(res => {
                      memoryList[i].localPicPathList[j] = res.tempFilePath;
                      updateState = true;
                      resolve(true);
                    })
                    .catch(res => {
                      resolve(true);
                    })
                })
            }
          })
        }
        await Promise.all(smallProArr);
        resolve(true)
      })
    }
    await Promise.all(bigProArr).then(async (res) => {
      if (updateState == true) await that.updateMemoryListToCloud(memoryList);
    })
  },

  /**
   * 向云端更新回忆列表
   * @param {Array} memoryList 回忆列表
   */
  async updateMemoryListToCloud(memoryList) {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'updateMemoryListByOpenId',
          data: {
            memoryList: memoryList
          }
        })
        .then(async (res) => {
          if (res.result && res.result.result) {
            that.setData({
              memoryList: memoryList,
              memorySum: memoryList.length
            })
            wx.setStorageSync('memoryList', memoryList);
            resolve(true);
          } else {
            that.setData({
              memoryList: [],
              memorySum: 0
            })
            resolve(false);
          }
        })
        .catch(error => {
          resolve(false);
        })
    });
    let result = await p;
    if (!result) that.showErrorTip();
  },

  /**
   * 从云端获取公告数据
   */
  getNoticeDataFromCloud() {
    let that = this;
    const db = wx.cloud.database();
    const notice = db.collection('notice');
    notice.where({
        _id: '8937eaa9613daffc0aa0e12b080c9859'
      })
      .get({
        success(res) {
          if (res.data[0] && res.data[0].noticeData && res.data[0].noticeData[0]) {
            let noticeData = res.data[0].noticeData[0].notice;
            that.setData({
              noticeData: noticeData
            })
            wx.setStorageSync('noticeData', noticeData);
          }
        }
      })
  },

  /**
   * 触碰回忆详情页蒙版
   * @param {Object} e 点击事件的对象
   */
  onClickMemoryMask(e) {
    let that = this;
    that.setData({
      showMemoryInfo: false,
      showPopup: false,
      memoryInfo: {}
    })
  },

  /**
   * 预览回忆图片
   * @param {Object} e 当前点击的对象
   */
  onPreviewPic(e) {
    let that = this;
    let index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: that.data.memoryInfo.localPicPathList[index],
      urls: that.data.memoryInfo.localPicPathList
    })
  },

  /**
   * 添加回忆的标题
   * @param {Object} e 当前点击的对象
   */
  addMemoryTitle(e) {
    let that = this;
    that.setData({
      [`${`addMemory.${'title'}`}`]: e.detail.value
    })
  },

  /**
   * 点击添加图片
   */
  onClickAddPic() {
    let that = this;
    let localPicPathList = that.data.addMemory.localPicPathList;
    if (localPicPathList.length >= 5) {
      wx.showToast({
        title: '图片最多记录5张',
        icon: 'none',
        duration: 1500
      });
    } else {
      let imgCount = 5 - localPicPathList.length;
      wx.chooseMedia({
        count: imgCount,
        mediaType: ['image'],
        sourceType: ['album'],
        sizeType: ['compressed'],
        success(res) {
          let tempFiles = res.tempFiles;
          for (let i = 0; i < tempFiles.length; i++) {
            localPicPathList.push(tempFiles[i].tempFilePath);
          }
          that.setData({
            [`${`addMemory.${'localPicPathList'}`}`]: localPicPathList
          })
        }
      })
    }
  },

  /**
   * 预览添加的回忆图片
   * @param {Object} e 当前点击的对象
   */
  onPreviewAddPic(e) {
    let that = this;
    let index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: that.data.addMemory.localPicPathList[index],
      urls: that.data.addMemory.localPicPathList
    })
  },

  /**
   * 删除已添加的回忆图片
   * @param {object} e 当前点击的对象
   */
  onClickDeletePic(e) {
    let that = this;
    let index = e.currentTarget.dataset.index;
    let localPicPathList = that.data.addMemory.localPicPathList;
    localPicPathList.splice(index, 1);
    that.setData({
      [`${`addMemory.${'localPicPathList'}`}`]: localPicPathList
    })
  },

  /**
   * 添加回忆的内容
   * @param {Object} e 当前点击的对象
   */
  addMemoryContent(e) {
    let that = this;
    that.setData({
      [`${`addMemory.${'content'}`}`]: e.detail.value
    })
  },

  /**
   * 点击记录回忆
   */
  async onClickRecordMemory() {
    let that = this;
    let memoryTitle = that.data.addMemory.title;
    let memoryContent = that.data.addMemory.content;

    if (memoryTitle == '') {
      wx.showToast({
        title: '回忆标题不能为空',
        icon: 'none',
        duration: 1500
      })
      return;
    }
    if (that.recordMemoryState == true) return;
    that.recordMemoryState = true;
    wx.showModal({
        title: '温馨提示',
        content: '确定记录这篇回忆了吗',
        cancelText: '取消',
        confirmText: '确定'
      })
      .then(async (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '记录中...',
            mask: true
          })
          that.recordMemoryState = false;
          if (!await that.checkMsgSecFromCloud(memoryTitle)) {
            wx.hideLoading();
            wx.showModal({
              showCancel: false,
              title: '温馨提示',
              content: '回忆标题存在违规信息',
              confirmText: '确定'
            })
            return;
          }
          if (memoryContent && !await that.checkMsgSecFromCloud(memoryContent)) {
            wx.hideLoading();
            wx.showModal({
              showCancel: false,
              title: '温馨提示',
              content: '回忆内容存在违规信息',
              confirmText: '确定'
            })
            return;
          }
          that.startAddMemory();
        } else {
          that.recordMemoryState = false;
        }
      })
  },

  /**
   * 从云端检测内容是否合规
   * @param {String} context 检测的内容
   */
  async checkMsgSecFromCloud(context) {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'checkMsgSec',
          data: {
            content: context
          },
        })
        .then(res => {
          if (res.result && res.result.result && res.result.data && res.result.data.errCode == 0) {
            if (res.result.data.result && res.result.data.result.suggest == 'pass') resolve(true);
            else resolve(false);
          } else {
            resolve(false);
          }
        })
        .catch(error => {
          resolve(false);
        })
    });
    return await p;
  },

  /**
   * 点击返回回忆页
   */
  onClickBackMemory() {
    let that = this;
    wx.showModal({
        title: '温馨提示',
        content: '返回会清空当前所记回忆',
        cancelText: '取消',
        confirmText: '确定'
      })
      .then(res => {
        if (res.confirm) {
          that.setData({
            showPopup: false,
            showAddMemory: false,
            [`${`addMemory.${'title'}`}`]: '',
            [`${`addMemory.${'localPicPathList'}`}`]: [],
            [`${`addMemory.${'content'}`}`]: ''
          })
        }
      })
  },

  /**
   * 开始添加回忆
   */
  async startAddMemory() {
    let that = this;
    let localPicPathList = that.data.addMemory.localPicPathList;
    if (localPicPathList[0] != undefined) await that.uploadLocalPicListToCloud();
    await that.getCurrentAddressInfo();
    await that.getCurrentDate();

    let memoryList = that.data.memoryList;
    let addMemory = that.data.addMemory;

    memoryList.unshift(addMemory);
    await that.updateMemoryListToCloud(memoryList);
    that.finishAddMemory();
  },

  /**
   * 上传本地图片列表到云端
   */
  async uploadLocalPicListToCloud() {
    let that = this;
    let proArr = []; // promise返回值数组
    let localPicPathList = that.data.addMemory.localPicPathList;
    for (let i = 0; i < localPicPathList.length; i++) {
      proArr[i] = new Promise(async function (resolve, reject) {
        let currentInfo = await that.getOpenIdFromCloud();
        if (!currentInfo) resolve('');
        wx.cloud.uploadFile({
            cloudPath: currentInfo.openId + '/' + currentInfo.date + '.jpg', // 上传至云端的路径
            filePath: localPicPathList[i], // 上传的临时文件路径
          })
          .then(res => {
            resolve(res.fileID);
          })
          .catch(error => {
            resolve('');
          })
      })
    }
    await Promise.all(proArr).then((res) => {
      //全都图片都上传成功后
      that.setData({
        [`${`addMemory.${'cloudPicPathList'}`}`]: res
      })
    }).catch((err) => {
      wx.hideLoading();
      that.showErrorTip();
    })
  },

  /**
   * 获取用户当前地址信息
   */
  async getCurrentAddressInfo() {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.startLocationUpdate().then(res => {
          wx.onLocationChange(async (res) => {
            await that.getCurrentLocation(res.latitude, res.longitude)
            wx.offLocationChange();
            wx.stopLocationUpdate();
            resolve(true);
          })
        })
        .catch(err => {
          resolve(false);
        })
    })

    await p;
  },

  /**
   * 获取用户当前位置信息
   * @param {String} latitude 纬度
   * @param {String} longitude 经度
   */
  async getCurrentLocation(latitude, longitude) {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      qqmapsdk.reverseGeocoder({
        location: {
          latitude: latitude,
          longitude: longitude
        },
        async success(res) {
          if (res && res.result) {
            let address = res.result.address ? res.result.address : ''; // 详细地址
            let city = res.result.ad_info.city ? res.result.ad_info.city : ''; // 城市
            let district = res.result.ad_info.district ? res.result.ad_info.district : ''; // 区
            let simpleAddress = district ? district : city; // 简易地址
            if (district != '') await that.getCurrentWeather(district, address, simpleAddress); // 获取当前位置天气
            else if (city != '') await that.getCurrentWeather(city, address, simpleAddress);
            resolve(true);
          } else {
            resolve(false);
          }
        }
      })
    })

    await p;
  },

  /**
   * 获取用户当前天气信息
   * @param {String} location 位置信息
   * @param {String} address 详细地址
   * @param {String} simpleAddress 简易地址
   */
  async getCurrentWeather(location, address, simpleAddress) {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.request({
        url: 'https://free-api.heweather.net/s6/weather/now',
        data: {
          location: location,
          key: "2ce65b27e7784d0f85ecd7b8127f5e2d"
        },
        success(res) {
          let weather = res.data.HeWeather6[0].now.cond_txt ? res.data.HeWeather6[0].now.cond_txt : '';
          let temperature = res.data.HeWeather6[0].now.fl ? res.data.HeWeather6[0].now.fl + '℃' : '';
          that.setData({
            [`${`addMemory.${'address'}`}`]: address + ' ' + weather + ' ' + temperature,
            [`${`addMemory.${'simpleAddress'}`}`]: simpleAddress + ' ' + weather + ' ' + temperature
          })
          resolve(true);
        },
        fail(err) {
          resolve(false);
        }
      })
    })

    await p;
  },

  /**
   * 获取当前日期
   */
  async getCurrentDate() {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'getCurrentDate'
        })
        .then(res => {
          if (res.result && res.result.result) {
            let date = res.result.currentDate;
            let id = res.result.currentId;
            that.setData({
              [`${`addMemory.${'date'}`}`]: date,
              [`${`addMemory.${'id'}`}`]: id
            })
            resolve(true);
          } else {
            resolve(false);
          }
        })
        .catch(error => {
          resolve(false);
        })
    });
    let result = await p;
    if (!result) that.showErrorTip();
  },

  /**
   * 完成回忆的添加
   */
  finishAddMemory() {
    let that = this;
    let addMemory = {
      title: '',
      localPicPathList: [],
      content: '',
      cloudPicPathList: [],
      id: 0,
      date: '',
      address: '',
      simpleAddress: ''
    };
    that.setData({
      showAddMemory: false,
      showPopup: false,
      addMemory: addMemory
    })
    wx.hideLoading();
    wx.showToast({
      title: '记录成功',
      icon: 'none',
      duration: 400
    })
  },

  /**
   * 通过回忆Id删除该回忆
   * @param {String} memoryId 回忆Id
   * @param {String} memoryTitle 回忆标题
   */
  deleteMemoryById(memoryId, memoryTitle) {
    let that = this;
    wx.showModal({
      title: '温馨提示',
      content: '是否删除《' + memoryTitle + '》这篇回忆',
      cancelText: '取消',
      confirmText: '确定',
      success(res) {
        if (res.confirm) {
          let memoryList = that.data.memoryList;
          wx.showLoading({
            title: '删除中...',
            mask: true
          })
          let deleteMemory = memoryList.find(function (object) {
            return object.id == memoryId;
          })
          let deleteMemoryIndex = memoryList.findIndex(function (object) {
            return object.id == memoryId;
          })
          if (deleteMemory.cloudPicPathList && deleteMemory.cloudPicPathList[0]) that.deletePicListFromCloud(deleteMemory.cloudPicPathList);
          memoryList.splice(deleteMemoryIndex, 1);
          that.setData({
            memoryList: memoryList,
            memorySum: memoryList.length
          })
          wx.setStorageSync('memoryList', memoryList);
          wx.cloud.callFunction({
              name: 'deleteMemoryById',
              data: {
                memoryId: memoryId
              },
            })
            .then(res => {
              console.log(res)
              if (res.result && res.result.result) {
                wx.hideLoading();
                wx.showToast({
                  title: '删除成功',
                  icon: 'none',
                  duration: 1500
                })
              } else {
                wx.hideLoading();
                that.showErrorTip();
              }
            })
            .catch(error => {
              wx.hideLoading();
              that.showErrorTip();
            })
        }
      }
    })
  },

  /**
   * 从云端删除云存储图片列表
   * @param {Array} cloudPicPathList 云存储图片列表
   */
  async deletePicListFromCloud(cloudPicPathList) {
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'deletePicListFromCloud',
          data: {
            cloudPicPathList: cloudPicPathList
          },
        })
        .then(res => {
          if (res.result && res.result.result) {
            resolve(true);
          } else {
            resolve(false);
          }
        })
        .catch(error => {
          resolve(false);
        })
    });

    await p;
  },

  /**
   * 从云端获取用户openId
   */
  async getOpenIdFromCloud() {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'getOpenId'
        })
        .then(res => {
          if (res.result && res.result.result) {
            resolve(res.result);
          } else resolve(false);
        })
        .catch(error => {
          resolve(false);
        })
    });
    return await p;
  },

  /**
   * 显示错误提示
   */
  showErrorTip() {
    wx.showToast({
      title: '网络异常请重启',
      icon: 'error',
      duration: 2000
    })
  },
});