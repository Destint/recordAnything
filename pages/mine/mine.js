/**
 * @file "我的"页面
 * @author Trick 2022-04-18
 */
const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    showPopup: false, // 是否显示弹出窗口(true可以防止弹窗穿透)
    calendar: wx.getStorageSync('calendar') ? wx.getStorageSync('calendar') : {}, // 万年历
    showFeedback: false, // 是否显示意见反馈
    localPicPathList: [], // 本地图片路径列表
    cloudPicPathList: [], // 云端图片路径列表
    feedbackContent: '', // 意见反馈内容
    avatar: wx.getStorageSync('avatar') ? wx.getStorageSync('avatar') : '../../images/img_default_avatar.png', // 用户头像
    showSetNicknameView: false, // 显示设置昵称页面
    setNicknameContent: '', // 设置昵称的内容
    nickname: wx.getStorageSync('nickname') ? wx.getStorageSync('nickname') : '昵称', // 用户昵称
    hasManagePermission: false, // 是否有管理权限 有则显示设置公告功能
    showSetNoticeView: false, // 显示设置公告页面
    setNoticeContent: '', // 设置公告的内容
    showAboutSelf: false, // 显示关于回忆录
    aboutSelfContent: '这是一个可以《留住回忆》的小程序。\n可选的需要小程序授权的功能：\n1、开启定位后，可在记录回忆时记下位置与天气。\n2、开启录音后，可在记录回忆时记下声音。\n3、可从相册中选择想要的图片一同记录。\n如果您在使用小程序时遇到任何问题或者您对小程序有更好的建议或想法，欢迎通过《意见反馈》或《联系客服》功能来向开发者反馈。', // 关于回忆录的文本
    praiseState: wx.getStorageSync('praiseState') ? wx.getStorageSync('praiseState') : false, // 是否赞美小程序
    praiseSum: wx.getStorageSync('praiseSum') ? wx.getStorageSync('praiseSum') : 0, // 赞美小程序的总人数
    showOtherFunctionView: false, // 是否显示其他功能页面(今日宜忌)
    otherFunctionTitle: '', // 其他功能页标题
    otherFunctionContent: '', // 其他功能页内容
    showRandomChooseView: false, // 是否显示随机选择页面
    setRandomChooseContent: '', // 设置随机选择的内容
    randomChooseList: [], // 随机选择的内容列表
    randomChooseContent: '', // 随机选择的内容
    showRotaryTableView: false, // 是否显示转盘页面
    rotationAngle: 0, // 转盘指针旋转角度
    randomChooseValue: 0, // 随机旋转的值
  },

  uploadFeedbackState: false, // 上传意见反馈的状态(防止两次点击上传)

  /**
   * 页面创建时执行
   */
  onLoad() {
    let that = this;
    wx.showShareMenu();
    that.getCalendarInfo();
    that.getManagePermission();
    that.checkLocalAvatarPath();
    that.checkNickname();
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
      title: '记你所记 想你所想',
      path: '/pages/memory/memory',
      imageUrl: '/images/img_logo.png'
    };
  },

  /**
   * 获取万年历信息
   */
  async getCalendarInfo() {
    let that = this;
    let currentDate = await that.getCurrentDate();
    if (!currentDate) return;
    currentDate = currentDate.slice(0, 10);
    let oldCalendar = wx.getStorageSync('calendar');
    if (oldCalendar && oldCalendar.date === currentDate) return;
    wx.request({
      url: 'https://api.djapi.cn/wannianli/get',
      data: {
        date: currentDate,
        cn_to_unicode: '1',
        token: '37555a616248cb486ca0e60c10eca164',
        datatype: 'json'
      },
      header: {
        'content-type': 'application/json'
      },
      success(res) {
        let result = res.data.Result;
        let calendar = {};
        calendar['date'] = currentDate;
        calendar['year'] = result.nianci.slice(0, 3);
        calendar['month'] = result.nianci.slice(3, 6);
        calendar['day'] = result.nianci.slice(6, 9);
        calendar['zodiac'] = result.shengxiao;
        calendar['lunar'] = result.nongli.slice(3, 7);
        calendar['solarTerm'] = result.jieqi;
        calendar['suitable'] = result.do;
        calendar['tapu'] = result.nodo;
        that.setData({
          calendar: calendar
        })
        wx.setStorageSync('calendar', calendar);
      },
      fail() {}
    })
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
            resolve(res.result.currentDate);
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
   * 点击意见反馈
   */
  onClickFeedback() {
    let that = this;
    that.setData({
      showPopup: true,
      showFeedback: true
    })
  },

  /**
   * 点击添加图片
   */
  onClickAddPic() {
    let that = this;
    let localPicPathList = that.data.localPicPathList;
    if (localPicPathList.length >= 5) {
      wx.showToast({
        title: '图片最多上传5张',
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
            localPicPathList: localPicPathList
          })
        }
      })
    }
  },

  /**
   * 预览意见反馈的图片
   * @param {Object} e 当前点击的对象
   */
  onPreviewAddPic(e) {
    let that = this;
    let index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: that.data.localPicPathList[index],
      urls: that.data.localPicPathList
    })
  },

  /**
   * 删除已添加的意见反馈的图片
   * @param {object} e 当前点击的对象
   */
  onClickDeletePic(e) {
    let that = this;
    let index = e.currentTarget.dataset.index;
    let localPicPathList = that.data.localPicPathList;
    localPicPathList.splice(index, 1);
    that.setData({
      localPicPathList: localPicPathList
    })
  },

  /**
   * 意见反馈的内容
   * @param {Object} e 当前点击的对象
   */
  feedbackContent(e) {
    let that = this;
    that.setData({
      feedbackContent: e.detail.value
    })
  },

  /**
   * 意见反馈时点击返回
   */
  onClickBackMine() {
    let that = this;
    wx.showModal({
        title: '温馨提示',
        content: '返回会清空当前编辑的意见反馈',
        cancelText: '取消',
        confirmText: '确定'
      })
      .then(res => {
        if (res.confirm) {
          that.setData({
            showPopup: false,
            showFeedback: false,
            localPicPathList: [],
            cloudPicPathList: [],
            feedbackContent: ''
          })
        }
      })
  },

  /**
   * 点击上传意见反馈
   */
  onClickUploadFeedback() {
    let that = this;
    let feedbackContent = that.data.feedbackContent;

    if (feedbackContent == '') {
      wx.showToast({
        title: '反馈内容不能为空',
        icon: 'none',
        duration: 1500
      })
      return;
    }
    if (that.uploadFeedbackState === true) return;
    that.uploadFeedbackState = true;
    wx.showModal({
        title: '温馨提示',
        content: '确定上传您的反馈吗',
        cancelText: '取消',
        confirmText: '确定'
      })
      .then(async res => {
        if (res.confirm) {
          await that.startUploadFeedback();
          that.uploadFeedbackState = false;
        } else {
          that.uploadFeedbackState = false;
        }
      })
  },

  /**
   * 开始上传意见反馈
   */
  async startUploadFeedback() {
    let that = this;
    wx.showLoading({
      title: '上传中...',
      mask: true
    })
    await that.uploadLocalPicList();
    await that.uploadFeedback();
    that.setData({
      cloudPicPathList: [],
      feedbackContent: '',
      localPicPathList: [],
      showPopup: false,
      showFeedback: false
    })
    wx.hideLoading();
    wx.showToast({
      title: '反馈成功',
      icon: 'none',
      duration: 1500
    })
  },

  /**
   * 上传本地图片列表
   */
  async uploadLocalPicList() {
    let that = this;
    let proArr = []; // promise返回值数组
    let localPicPathList = that.data.localPicPathList;
    let cloudPicPathList = [];
    let currentInfo = await that.getOpenId();
    for (let i = 0; i < localPicPathList.length; i++) {
      proArr[i] = new Promise(async function (resolve, reject) {
        wx.compressImage({
            src: localPicPathList[i]
          })
          .then(res => {
            wx.cloud.uploadFile({
                cloudPath: currentInfo.openId + '/' + currentInfo.date + i + '.jpg', // 上传至云端的路径
                filePath: res.tempFilePath, // 上传的临时文件路径
              })
              .then(res => {
                cloudPicPathList[i] = res.fileID;
                resolve(true);
              })
              .catch(error => {
                cloudPicPathList[i] = "";
                resolve(true);
              })
          })
      })
    }
    await Promise.all(proArr).then((res) => {
      //全都图片都上传成功后
      that.setData({
        cloudPicPathList: cloudPicPathList
      })
    }).catch((err) => {})
  },

  /**
   * 获取用户openId
   */
  async getOpenId() {
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
   * 上传意见反馈
   */
  async uploadFeedback() {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'uploadFeedback',
          data: {
            cloudPicPathList: that.data.cloudPicPathList,
            feedbackContent: that.data.feedbackContent
          }
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
    let result = await p;
    if (!result) that.showErrorTip();
  },

  /**
   * 点击设置头像
   */
  onClickSetAvatar() {
    let that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      sizeType: ['compressed'],
      success(res) {
        wx.showLoading({
          title: '设置中...',
          mask: true
        })
        let tempFiles = res.tempFiles;
        wx.compressImage({
            src: tempFiles[0].tempFilePath,
          })
          .then(async res => {
            wx.setStorageSync('avatar', res.tempFilePath);
            let cloudAvatarPath = await that.uploadAvatar(res.tempFilePath);
            await that.uploadUserInfo(cloudAvatarPath, '');
            that.setData({
              avatar: res.tempFilePath
            })
            wx.hideLoading();
            wx.showToast({
              title: '设置成功',
              icon: 'none'
            })
          })
          .catch(err => {})
      }
    })
  },

  /**
   * 上传头像
   * @param {String} localAvatarPath 本地头像路径
   */
  async uploadAvatar(localAvatarPath) {
    let that = this;
    let currentInfo = await that.getOpenId();
    let p = new Promise(async function (resolve, reject) {
      wx.cloud.uploadFile({
          cloudPath: 'userAvatar/' + currentInfo.openId + '.jpg', // 上传至云端的路径
          filePath: localAvatarPath, // 上传的临时文件路径
        })
        .then(res => {
          resolve(res.fileID);
        })
        .catch(error => {
          resolve('');
        })
    })
    return await p;
  },

  /**
   * 上传用户信息
   * @param {String} cloudAvatarPath 云端头像路径 没有则传''
   * @param {String} nickname 昵称 没有则传''
   */
  async uploadUserInfo(cloudAvatarPath, nickname) {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'uploadUserInfo',
          data: {
            cloudAvatarPath: cloudAvatarPath,
            nickname: nickname
          }
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
   * 点击设置昵称
   */
  onClickSetNickname() {
    let that = this;
    that.setData({
      showPopup: true,
      showSetNicknameView: true
    })
  },

  /**
   * 点击设置昵称页蒙版
   */
  onClickSetNicknameMask() {
    let that = this;
    that.setData({
      showPopup: false,
      showSetNicknameView: false,
      setNicknameContent: ''
    })
  },

  /**
   * 设置昵称的内容
   * @param {Object} e 当前点击的对象
   */
  setNicknameContent(e) {
    let that = this;
    that.setData({
      setNicknameContent: e.detail.value
    })
  },

  /**
   * 点击上传昵称
   */
  onClickUploadNickname() {
    let that = this;
    let nickname = that.data.setNicknameContent;
    if (!nickname) {
      wx.showToast({
        title: '昵称不能为空',
        icon: 'none'
      })
    } else {
      wx.showModal({
          title: '温馨提示',
          content: '确定设置该昵称吗',
          cancelText: '取消',
          confirmText: '确定'
        })
        .then(async res => {
          if (res.confirm) {
            wx.showLoading({
              title: '设置中...',
              mask: true
            })
            wx.setStorageSync('nickname', nickname);
            await that.uploadUserInfo('', nickname);
            that.setData({
              showPopup: false,
              showSetNicknameView: false,
              nickname: nickname,
              setNicknameContent: ''
            })
            wx.hideLoading();
            wx.showToast({
              title: '设置成功',
              icon: 'none'
            })
          }
        })
    }
  },

  /**
   * 获取管理员权限
   */
  getManagePermission() {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'getManagePermission'
        })
        .then(res => {
          if (res.result && res.result.result) {
            that.setData({
              hasManagePermission: res.result.hasManagePermission
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
  },

  /**
   * 点击设置公告
   */
  onClickSetNotice() {
    let that = this;
    that.setData({
      showPopup: true,
      showSetNoticeView: true
    })
  },

  /**
   * 点击设置公告页蒙版
   */
  onClickSetNoticeMask() {
    let that = this;
    that.setData({
      showPopup: false,
      showSetNoticeView: false,
      setNoticeContent: ''
    })
  },

  /**
   * 设置公告的内容
   * @param {Object} e 当前点击的对象
   */
  setNoticeContent(e) {
    let that = this;
    that.setData({
      setNoticeContent: e.detail.value
    })
  },

  /**
   * 点击上传公告
   */
  onClickUploadNotice() {
    let that = this;
    let notice = that.data.setNoticeContent;
    if (!notice) {
      wx.showToast({
        title: '公告内容不能为空',
        icon: 'none'
      })
    } else {
      wx.showModal({
          title: '温馨提示',
          content: '确定更新该公告吗',
          cancelText: '取消',
          confirmText: '确定'
        })
        .then(async res => {
          if (res.confirm) {
            wx.showLoading({
              title: '更新中...',
            })
            wx.setStorageSync('notice', notice)
            await that.uploadNotice(notice);
            that.setData({
              showPopup: false,
              showSetNoticeView: false,
              setNoticeContent: ''
            })
            wx.hideLoading();
            wx.showToast({
              title: '更新完成',
              icon: 'none'
            })
          }
        })
    }
  },

  /**
   * 上传公告
   * @param {String} notice 公告
   */
  async uploadNotice(notice) {
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'uploadNotice',
          data: {
            notice: notice
          }
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
   * 点击关于回忆录
   */
  onClickAbout() {
    let that = this;
    that.getPraiseInfo();
    that.setData({
      showPopup: true,
      showAboutSelf: true
    })
  },

  /**
   * 点击关于回忆页的蒙版
   */
  onClickAboutSelfMask() {
    let that = this;
    that.setData({
      showPopup: false,
      showAboutSelf: false
    })
  },

  /**
   * 获取点赞信息
   */
  async getPraiseInfo() {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'getPraiseInfo'
        })
        .then(res => {
          if (res.result && res.result.result) {
            that.setData({
              praiseState: res.result.praiseState,
              praiseSum: res.result.praiseSum
            })
            wx.setStorageSync('praiseState', res.result.praiseState);
            wx.setStorageSync('praiseSum', res.result.praiseSum);
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
   * 点击赞美
   */
  onClickPraise() {
    let that = this;
    if (!that.data.praiseState) that.uploadPraise();
  },

  /**
   * 上传点赞
   */
  uploadPraise() {
    let that = this;
    wx.cloud.callFunction({
        name: 'uploadPraise',
      })
      .then(res => {
        if (res.result && res.result.result) {
          that.setData({
            praiseState: res.result.praiseState,
            praiseSum: res.result.praiseSum
          })
          wx.setStorageSync('praiseState', res.result.praiseState);
          wx.setStorageSync('praiseSum', res.result.praiseSum);
        }
      })
      .catch(error => {})
  },

  /**
   * 检测本地头像路径是否存在
   */
  async checkLocalAvatarPath() {
    let that = this;
    let localAvatarPath = wx.getStorageSync('avatar') ? wx.getStorageSync('avatar') : "avatarPath";
    wx.getImageInfo({
        src: localAvatarPath
      })
      .then(res => {})
      .catch(async (res) => {
        let userInfo = await that.getUserInfo();
        if (!userInfo) return;
        await wx.cloud.downloadFile({
            fileID: userInfo.cloudAvatarPath
          })
          .then(res => {
            wx.setStorageSync('avatar', res.tempFilePath);
            that.setData({
              avatar: res.tempFilePath
            })
          })
          .catch(res => {
            that.setData({
              avatar: '../../images/img_default_avatar.png'
            })
          })
      })
  },

  /**
   * 获取用户信息
   */
  async getUserInfo() {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'getUserInfo'
        })
        .then(res => {
          if (res.result && res.result.result) {
            resolve(res.result.userInfo);
          } else resolve(false);
        })
        .catch(error => {
          resolve(false);
        })
    });
    return await p;
  },

  /**
   * 检测本地昵称是否存在
   */
  async checkNickname() {
    let that = this;
    let nickname = wx.getStorageSync('nickname');
    let userInfo = await that.getUserInfo();
    if (!userInfo || userInfo.nickname === nickname) return;
    wx.setStorageSync('nickname', userInfo.nickname);
    that.setData({
      nickname: userInfo.nickname
    })
  },

  /**
   * 点击今日宜忌
   */
  onClickSuitAndAvoid() {
    let that = this;
    let otherFunctionTitle = "今日宜忌";
    let otherFunctionContent = "宜: " + that.data.calendar.suitable + "\n忌: " + that.data.calendar.tapu;
    that.setData({
      showOtherFunctionView: true,
      showPopup: true,
      otherFunctionTitle: otherFunctionTitle,
      otherFunctionContent: otherFunctionContent
    })
  },

  /**
   * 点击随机笑话
   */
  onClickRandomJoke() {
    let that = this;
    wx.request({
      url: 'https://www.mxnzp.com/api/jokes/list/random',
      data: {
        app_id: 'fjkpgjqmxolqnmqm',
        app_secret: 'SEJGam9aWldEaUFtQWIyZ0FHTHZhQT09'
      },
      header: {
        'content-type': 'application/json'
      },
      success(res) {
        let jokeList = res.data.data;
        let randomJoke = jokeList[Math.floor(Math.random() * (jokeList.length))];
        let otherFunctionTitle = "随机笑话";
        let otherFunctionContent = randomJoke ? randomJoke.content : '获取笑话失败请重试';
        that.setData({
          showOtherFunctionView: true,
          showPopup: true,
          otherFunctionTitle: otherFunctionTitle,
          otherFunctionContent: otherFunctionContent
        })
      },
      fail() {
        that.showErrorTip();
      }
    })
  },

  /**
   * 点击随机土味
   */
  onClickRandomEarthy() {
    let that = this;
    wx.request({
      url: 'https://api.uomg.com/api/rand.qinghua',
      data: {
        format: 'json'
      },
      header: {
        'content-type': 'application/json'
      },
      success(res) {
        let otherFunctionTitle = "随机土味";
        let otherFunctionContent = res.data && res.data.content ? res.data.content : '获取土味失败请重试';
        that.setData({
          showOtherFunctionView: true,
          showPopup: true,
          otherFunctionTitle: otherFunctionTitle,
          otherFunctionContent: otherFunctionContent
        })
      },
      fail() {
        that.showErrorTip();
      }
    })
  },

  /**
   * 触碰其他功能页蒙版
   * @param {Object} e 点击事件的对象
   */
  onClickOtherFunctionMask(e) {
    let that = this;
    that.setData({
      showOtherFunctionView: false,
      showPopup: false,
      otherFunctionTitle: '',
      otherFunctionContent: ''
    })
  },

  /**
   * 点击随机选择
   */
  onClickRandomChoose() {
    let that = this;
    that.setData({
      showRandomChooseView: true,
      showRotaryTableView: false,
      showPopup: true,
      setRandomChooseContent: '',
      randomChooseList: [],
      randomChooseContent: '',
      rotationAngle: 0,
      randomChooseValue: 0
    })
  },

  /**
   * 设置随机选择的内容
   * @param {Object} e 当前点击的对象
   */
  setRandomChooseContent(e) {
    let that = this;
    that.setData({
      setRandomChooseContent: e.detail.value
    })
  },

  /**
   * 点击添加随机选择内容
   */
  onClickAddRandomChoose() {
    let that = this;
    if (that.data.randomChooseList.length >= 4) {
      wx.showToast({
        title: '选择已达上限',
        icon: 'none'
      })
      return;
    }
    if (that.data.setRandomChooseContent !== '') {
      let randomChooseList = that.data.randomChooseList;
      let randomChooseContent = that.data.randomChooseContent;
      randomChooseList.push(that.data.setRandomChooseContent);
      randomChooseContent += that.data.setRandomChooseContent + '  ';
      that.setData({
        randomChooseList: randomChooseList,
        setRandomChooseContent: '',
        randomChooseContent: randomChooseContent
      })
    } else {
      wx.showToast({
        title: '未填写选择内容',
        icon: 'none'
      })
    }
  },

  /**
   * 点击取消选择
   */
  onClickCancelChoose() {
    let that = this;
    wx.showModal({
        title: '温馨提示',
        content: '退出随机选择吗',
        cancelText: '取消',
        confirmText: '确定'
      })
      .then(res => {
        if (res.confirm) {
          that.setData({
            showRandomChooseView: false,
            showPopup: false,
            setRandomChooseContent: '',
            randomChooseList: [],
            randomChooseContent: ''
          })
        }
      })
  },

  /**
   * 点击前往选择
   */
  onClickGoChoose() {
    let that = this;
    if (that.data.randomChooseList.length < 4) {
      wx.showToast({
        title: '选择内容不足',
        icon: 'none'
      })
    } else {
      that.setData({
        showRandomChooseView: false,
        showRotaryTableView: true,
      })
    }
  },

  /**
   * 点击转盘指针开始旋转
   */
  onClickRotaryPointer() {
    let that = this;
    let rotateNum = 0; // 旋转圈数
    that.setData({
      randomChooseValue: Math.floor(Math.random() * 360),
      rotationAngle: 0,
    })
    let rotateTimer = setInterval(function () {
      that.setData({
        rotationAngle: that.data.rotationAngle + 5
      })
      if (that.data.rotationAngle >= 360) {
        that.data.rotationAngle = 0;
        rotateNum = rotateNum + 1;
      }
      if (rotateNum === 3) {
        that.showRandomChooseContent();
        clearInterval(rotateTimer);
      }
    }, 5);
  },

  /**
   * 显示随机选择的内容
   */
  showRandomChooseContent() {
    let that = this;
    let randomChooseValue = that.data.randomChooseValue;
    let randomChooseList = that.data.randomChooseList;
    let result = '';
    if (randomChooseValue % 90 === 0) randomChooseValue++;
    if (randomChooseValue > 0 && randomChooseValue < 90) result = randomChooseList[1];
    else if (randomChooseValue > 90 && randomChooseValue < 180) result = randomChooseList[2];
    else if (randomChooseValue > 180 && randomChooseValue < 270) result = randomChooseList[3];
    else if (randomChooseValue > 270 && randomChooseValue < 360) result = randomChooseList[0];
    let showChooseTimer = setInterval(function () {
      that.setData({
        rotationAngle: that.data.rotationAngle + 2
      })
      if (that.data.rotationAngle >= that.data.randomChooseValue) {
        wx.showModal({
            title: '恭喜你',
            content: result,
            showCancel: false,
            confirmText: '确定'
          })
          .then(res => {
            if (res.confirm) {
              that.setData({
                showRandomChooseView: false,
                showRotaryTableView: false,
                showPopup: false,
                setRandomChooseContent: '',
                randomChooseList: [],
                randomChooseContent: '',
                rotationAngle: 0,
                randomChooseValue: 0
              })
            }
          })
        clearInterval(showChooseTimer);
      }
    }, 10);
  },

  /**
   * 显示错误提示
   */
  showErrorTip() {
    wx.showToast({
      title: '网络异常请重试',
      icon: 'error',
      duration: 2000
    })
  },
});