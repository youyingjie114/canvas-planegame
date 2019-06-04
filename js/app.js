/* eslint-disable no-undef */
// 元素
var container = document.getElementById('game')
var canvas = document.getElementById('canvas')
var context = canvas.getContext('2d')
const planeImageSrc = './img/plane.png'
const enemyImageSrc = './img/enemy.png'
const boomImageSrc = './img/boom.png'
var boomImage = new Image()
var enemyImage = new Image()
const LEFT_DIS = 30
const TOP_DIS = 30
const ENEMY_SIZE = 50
const ENEMY_MOVE_WIDTH = 640
const ENEMY_MOVE_HEIGHT = 440
const GAME_WIDTH = 700
const GAME_HEIGHT = 600
const PLANE_MOVE_WIDTH = 640
const PLANE_MOVE_HEIGHT = 100
const SCORE_LOC_X = 20
const SCORE_LOC_Y = 20

var config = {
  level: 1,
  totalLevel: 7,
  enemyLineNum: 7,
  enemyLineSpace: 50
}

var plane = {
  x: 320,
  y: 470,
  width: 60,
  height: 100,
  image: null,
  left: false,
  right: false,

  draw: function () {
    context.drawImage(this.image, this.x, this.y, this.width, this.height)
  },
  move: function (dir) {
    if (this.x <= 30 && dir === 'left') {
      this.left = false
      return
    } else if (this.x + this.width >= 640 && dir === 'right') {
      this.right = false
      return
    }
    switch (dir) {
      case 'left': this.x -= 5; break
      case 'right': this.x += 5; break
    }
  },
  bindEvent: function () {
    // 给飞机绑定事件
    $(document).on('keydown', function (e) {
      switch (e.keyCode) {
        case 37: plane.left = true; break
        case 39: plane.right = true; break
      }
    })
    $(document).on('keyup', function (e) {
      switch (e.keyCode) {
        case 37: plane.left = false; break
        case 39: plane.right = false; break
      }
    })
    $(document).on('keypress', _.debounce(function (e) {
      // 新建一个子弹实例，使用循环动画激活子弹的飞行
      if (e.keyCode !== 32) {
        return
      }
      var bullet = new Bullet(plane.x + (plane.width / 2), plane.y)
      bullet.draw()
      var game = GAME
      function animation () {
        for (let enemy of game.enemyArr) {
          if (bullet.shootIn(enemy)) {
            // TODO 调用boom
            bullet.boom()
            enemy.die()
            game.addScore()
            // 检测魔鬼数量，为0时候游戏成功
            if (--game.enemyNum === 0) {
              game.success()
            }
          }
        }
        if (bullet.flying && game.status === 'playing') {
          context.clearRect(bullet.x, bullet.y, bullet.width, bullet.len)
          bullet.fly()
          bullet.draw()
          requestAnimationFrame(animation)
        } else {
          context.clearRect(bullet.x, bullet.y, bullet.width, bullet.len)
        }
      }
      animation()
    }, 50))
  }
}

class Bullet {
  constructor (x, y) {
    this.x = x
    this.y = y
    this.flying = true
    this.len = 10
    this.width = 1
  }

  draw () {
    context.fillStyle = 'white'
    context.fillRect(this.x, this.y, this.width, this.len)
  }
  fly () {
    if (this.y <= 0) {
      this.flying = false
      context.clearRect(this.x, this.y, this.width, this.len)
    } else {
      this.y = this.y - 10
    }
  }
  shootIn (enemy) {
    if (enemy.alive && this.x <= enemy.x + enemy.width && enemy.x <= this.x && this.y <= enemy.y + enemy.height && enemy.y <= this.y) {
      return 1
    }
    return 0
  }
  boom () {
    // 将子弹的飞行状态置为false
    this.flying = false
  }
}

class Enemy {
  constructor (x, y) {
    this.x = x
    this.y = y
    this.width = ENEMY_SIZE
    this.height = ENEMY_SIZE
    this.breath = 0
    this.dying = false
    this.alive = true
  }

  draw () {
    context.drawImage(enemyImage, this.x, this.y, this.width, this.height)
  }
  move (dir) {
    if (this.x <= LEFT_DIS && dir === 'left') {
      return 0
    }
    if (this.x + this.width >= LEFT_DIS + ENEMY_MOVE_WIDTH && dir === 'right') {
      return 0
    }
    switch (dir) {
      case 'left': this.x -= 2; break
      case 'right': this.x += 2; break
      // case 'up': this.y -= 2; break
      case 'down': this.y += 50; break
    }
    return 1
  }
  die () {
    this.dying = true
    this.breath = 3
    this.alive = false
  }
}

/**
 * 整个游戏对象
 */
var GAME = {
  enemyArr: [],
  enemyNum: 0,
  enemyDir: 'right',
  score: 0,
  /**
   * 初始化函数,这个函数只执行一次
   * @param  {object} opts
   * @return {[type]} [description]
   */
  init: function (opts) {
    this.status = 'start'
    this.bindEvent()
  },
  bindEvent: function () {
    var self = this
    var playBtn = document.querySelector('.js-play')
    var replayBtn = $('.js-replay')
    var nextBtn = $('.js-next')
    // 开始游戏按钮绑定
    playBtn.onclick = function () {
      var image = new Image()
      image.src = planeImageSrc
      image.onload = function () {
        plane.image = image
        enemyImage.src = enemyImageSrc
        enemyImage.onload = function () {
          boomImage.src = boomImageSrc
          boomImage.onload = function () {
            self.play()
          }
        }
      }
    }
    replayBtn.on('click', function () {
      config.level = 1
      GAME.score = 0
      self.play()
    })
    nextBtn.on('click', function () {
      config.level++
      $(document).off()
      self.play()
    })
  },
  /**
   * 初始化怪兽
   * 添加动画，使怪兽动起来
   */
  initEnemy (num) {
    this.enemyNum = num
    this.enemyArr = []
    this.enemyDir = 'right'
    for (var i = 0; i < this.enemyNum; i++) {
      let enemy = new Enemy(LEFT_DIS + (i % config.enemyLineNum) * (ENEMY_SIZE + 10), TOP_DIS + (Math.floor(i / config.enemyLineNum)) * config.enemyLineSpace)
      enemy.draw()
      this.enemyArr.push(enemy)
    }
    var game = this
    // 激活动画
    var failed = false
    context.fillStyle = 'white'
    context.font = '18px Arial'
    function enemyMove () {
      let changeFlag = false
      context.clearRect(SCORE_LOC_X, SCORE_LOC_Y, 200, 30)
      // 循环遍历每个怪兽进行绘制
      for (let enemy of game.enemyArr) {
        // dying为true的时候，表示怪兽刚被子弹射中，需要留三帧时间绘制爆炸动画
        if (enemy.dying) {
          if (enemy.breath === 0) {
            enemy.dying = false
            context.clearRect(enemy.x, enemy.y, enemy.width, enemy.height)
            continue
          }
          context.clearRect(enemy.x, enemy.y, enemy.width, enemy.height)
          if (!enemy.move(game.enemyDir)) {
            changeFlag = true
          }
          context.drawImage(boomImage, enemy.x, enemy.y, enemy.width, enemy.height)
          enemy.breath--
        }
        // alive为true的时候，怪兽没有被子弹射中。dying为true时，alive已经为false
        if (enemy.alive) {
          context.clearRect(enemy.x, enemy.y, enemy.width, enemy.height)
          if (!enemy.move(game.enemyDir)) {
            changeFlag = true
          }
          enemy.draw()
        }
      }
      context.fillText(`分数：${game.score}`, SCORE_LOC_X, SCORE_LOC_Y + 20)
      if (changeFlag) {
        game.enemyDir === 'left' ? game.enemyDir = 'right' : game.enemyDir = 'left'
        // context.clearRect(LEFT_DIS, TOP_DIS, ENEMY_MOVE_WIDTH, ENEMY_MOVE_HEIGHT)
        for (let enemy of game.enemyArr) {
          context.clearRect(enemy.x, enemy.y, enemy.width, enemy.height)
          if (enemy.alive) {
            enemy.move('down')
          }
          if (enemy.y >= TOP_DIS + ENEMY_MOVE_HEIGHT) {
            failed = true
          }
        }
      }
      if (!failed && game.enemyNum) {
        requestAnimationFrame(enemyMove)
      } else if (failed) {
        game.over()
      } else if (!game.enemyNum) {
        game.success()
      }
    }
    enemyMove()
  },
  /**
   * 更新游戏状态，分别有以下几种状态：
   * start  游戏前
   * playing 游戏中
   * failed 游戏失败
   * success 游戏成功
   * all-success 游戏通过
   * stop 游戏暂停（可选）
   */
  setStatus: function (status) {
    this.status = status
    container.setAttribute('data-status', status)
  },
  addScore: function () {
    this.score++
  },
  allSuccess: function () {
    this.setStatus('all-success')
    $(document).off()
    plane.left = false
    plane.right = false
    context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    $('.game-failed .game-info-text .score').text(`${this.score}`)
  },
  success: function () {
    if (config.level === config.totalLevel) {
      this.allSuccess()
      return
    }
    this.setStatus('success')
    plane.left = false
    plane.right = false
    context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    $('.game-success > .game-info-text').text(`下一个level：${config.level + 1}`)
    $(document).on('keypress', function (e) {
      if (e.keyCode !== 13) {
        return
      }
      $('.js-next').click()
    })
  },
  over: function () {
    this.setStatus('failed')
    $(document).off()
    plane.left = false
    plane.right = false
    context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    $('.game-failed .game-info-text .score').text(`${this.score}`)
  },
  play: function () {
    this.setStatus('playing')  // 设为游戏状态
    plane.draw()               // 绘制飞机
    plane.bindEvent()          // 绑定飞机事件

    var game = this
    // 设置飞机绘制动画
    function animation () {
      if (plane.left) {
        plane.move('left')
      } else if (plane.right) {
        plane.move('right')
      }
      context.clearRect(LEFT_DIS, TOP_DIS + ENEMY_MOVE_HEIGHT, PLANE_MOVE_WIDTH, PLANE_MOVE_HEIGHT)
      plane.draw()
      if (game.status === 'playing') {
        requestAnimationFrame(animation)
      } else {
        game.over()
      }
    }
    animation()

    // 初始怪兽
    this.initEnemy(config.level * config.enemyLineNum)
  }
}

// 初始化
GAME.init()
