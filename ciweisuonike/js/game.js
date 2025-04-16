// 游戏核心配置，使用config.js中的设置
const config = {
    type: GAME_CONFIG.type,
    width: GAME_CONFIG.width,
    height: GAME_CONFIG.height,
    physics: GAME_CONFIG.physics,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);
let sonic;
let platforms;
let cursors;
let gameOver = false;
let score = 0;
let scoreText;
let canDoubleJump = false;
let hasDoubleJumped = false;
let spikes;
let coins;
let coinCount = 0;
let coinText;
let gameStarted = false;  // 添加游戏开始标志
let health = 3; // 玩家生命值
let healthText; // 生命值文字显示
let isJumping = false; // 跟踪玩家是否正在跳跃
let isHurt = false; // 记录玩家是否处于受伤状态
let enemies; // 新增怪物组
let jumpBuffer = false; // 跳跃缓冲标志
let jumpBufferTimer = null; // 跳跃缓冲计时器
let coyoteTime = false; // 小悬崖宽容时间标志
let coyoteTimer = null; // 小悬崖宽容时间计时器
let lastOnGround = 0; // 上次在地面上的时间

// 冲刺系统变量
let isDashing = false; // 是否正在冲刺
let canDash = true; // 是否可以冲刺
let dashCooldown = null; // 冲刺冷却计时器
let dashDirection = 0; // 冲刺方向 (-1左, 1右)
let dashParticles; // 冲刺粒子效果

// 新增按键变量
let dashKey; // 冲刺按键
let leftPressTime = 0; // 左键按下时间
let rightPressTime = 0; // 右键按下时间
let leftKeyPressed = false; // 左键是否按下
let rightKeyPressed = false; // 右键是否按下
let doubleTapWindow = 300; // 双击窗口时间（毫秒）
let leftTapCount = 0; // 左键点击次数
let rightTapCount = 0; // 右键点击次数
let tapTimer = null; // 点击计时器

// 使用config中的世界边界配置
const WORLD_WIDTH = WORLD.WIDTH;
const WORLD_HEIGHT = WORLD.HEIGHT;

// 常量配置
const COYOTE_TIME = 100; // 小悬崖宽容时间（毫秒）
const DASH_DURATION = 300; // 冲刺持续时间（毫秒）
const DASH_COOLDOWN = 1000; // 冲刺冷却时间（毫秒）
const DASH_SPEED = 500; // 冲刺速度
const DOUBLE_TAP_THRESHOLD = 300; // 双击阈值（毫秒）

function preload() {
    // 加载游戏资源
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('spike', 'assets/spike.png');
    this.load.image('coin', 'assets/coin.png');
    this.load.image('enemy', 'assets/spike.png'); // 使用尖刺图片作为怪物图片
    this.load.spritesheet('sonic', 
        'assets/sonic.png',
        { 
            frameWidth: 32, 
            frameHeight: 32,
            spacing: 0,
            margin: 0
        }
    );
}

function create() {
    // 设置世界边界
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    
    // 添加背景并平铺
    // 由于背景需要覆盖整个世界，我们需要创建多个背景图片
    for (let i = 0; i < 4; i++) {
        this.add.image(400 + i * 800, 300, 'sky').setDisplaySize(800, 600);
    }

    // 创建平台组
    platforms = this.physics.add.staticGroup();

    // 创建地面 - 扩展到整个世界宽度
    for (let i = 0; i < WORLD_WIDTH / 800; i++) {
        let ground = platforms.create(400 + i * 800, 568, 'ground');
        ground.setDisplaySize(800, 32);
        ground.refreshBody();
    }
    
    // 存储所有平台的位置信息，用于后续放置尖刺和怪物
    let platformPositions = [];
    
    // 添加分散在整个世界的平台
    // 第一区域 (0-800)
    createAndStorePlatform(600, 400, 200, platformPositions);
    createAndStorePlatform(50, 250, 200, platformPositions);
    createAndStorePlatform(300, 450, 200, platformPositions);
    
    // 第二区域 (800-1600)
    createAndStorePlatform(1000, 220, 200, platformPositions);
    createAndStorePlatform(1200, 350, 200, platformPositions);
    createAndStorePlatform(1500, 200, 200, platformPositions);
    
    // 第三区域 (1600-2400)
    createAndStorePlatform(1800, 150, 200, platformPositions);
    createAndStorePlatform(2000, 450, 200, platformPositions);
    createAndStorePlatform(2300, 300, 200, platformPositions);
    
    // 第四区域 (2400-3200)
    createAndStorePlatform(2600, 500, 200, platformPositions);
    createAndStorePlatform(2800, 250, 200, platformPositions);
    createAndStorePlatform(3000, 400, 200, platformPositions);

    // 创建平台辅助函数
    function createAndStorePlatform(x, y, width, positionsArray) {
        let platform = platforms.create(x, y, 'ground');
        platform.setDisplaySize(width, 32);
        platform.refreshBody();
        
        // 存储平台信息
        positionsArray.push({
            x: x,
            y: y - 16, // 平台表面位置
            width: width,
            height: 32
        });
    }

    // 创建尖刺组
    spikes = this.physics.add.staticGroup();
    
    // 在平台上随机放置尖刺
    platformPositions.forEach(platform => {
        // 每个平台有50%的几率生成尖刺
        if (Math.random() > 0.5) {
            // 在平台宽度范围内随机位置放置尖刺
            const minX = platform.x - platform.width / 2 + 16; // 避免尖刺放在平台边缘
            const maxX = platform.x + platform.width / 2 - 16;
            const spikeX = Phaser.Math.Between(minX, maxX);
            const spikeY = platform.y - 16; // 放在平台上方
            
            spikes.create(spikeX, spikeY, 'spike').setDisplaySize(32, 32).refreshBody();
        }
    });
    
    // 确保地面上也有一些尖刺
    for (let i = 0; i < 8; i++) {
        const spikeX = Phaser.Math.Between(100, WORLD_WIDTH - 100);
        spikes.create(spikeX, 552, 'spike').setDisplaySize(32, 32).refreshBody();
    }
    
    // 创建怪物组
    enemies = this.physics.add.group();
    
    // 在平台上随机放置怪物
    platformPositions.forEach(platform => {
        // 每个平台有30%的几率生成怪物，使用配置中的阈值
        if (Math.random() > ENEMIES.SPAWN_THRESHOLD && platform.width >= 100) {
            // 在平台中间位置放置怪物
            const enemyX = platform.x;
            const enemyY = platform.y - 16; // 放在平台上方
            
            // 创建怪物
            const enemy = enemies.create(enemyX, enemyY, 'enemy');
            enemy.setDisplaySize(32, 32);
            // 设置红色色调，区分于普通尖刺
            enemy.setTint(0xff0000);
            enemy.setBounce(0);
            enemy.setCollideWorldBounds(true);
            
            // 设置怪物初始移动方向和速度
            enemy.setVelocityX(Phaser.Math.Between(-100, 100));
            
            // 存储怪物初始平台的边界，用于限制移动范围
            enemy.platformBounds = {
                left: platform.x - platform.width / 2 + 16,
                right: platform.x + platform.width / 2 - 16
            };
            
            // 随机设置怪物的移动方向
            enemy.direction = Math.random() > 0.5 ? 1 : -1;
            // 使用配置中的速度范围
            enemy.moveSpeed = Phaser.Math.Between(ENEMIES.MOVE_SPEED_MIN, ENEMIES.MOVE_SPEED_MAX);
            enemy.setVelocityX(enemy.direction * enemy.moveSpeed);
            
            // 添加旋转动画，区分于静态尖刺
            this.tweens.add({
                targets: enemy,
                angle: 360,
                duration: ENEMIES.ROTATION_DURATION,
                repeat: -1
            });
        }
    });

    // 创建金币组
    coins = this.physics.add.group({
        allowGravity: false // 禁用重力影响金币
    });
    
    // 在整个世界中随机分布金币
    for (let i = 0; i < COINS.TOTAL_COUNT; i++) {
        // 随机选择金币的位置
        let x = Phaser.Math.Between(50, WORLD_WIDTH - 50);
        let y = Phaser.Math.Between(COINS.MIN_HEIGHT, COINS.MAX_HEIGHT);
        
        // 确保金币不会直接放在平台上
        let validPosition = true;
        platformPositions.forEach(platform => {
            // 检查金币是否在平台附近
            if (Math.abs(y - (platform.y - 20)) < 40 && 
                x > platform.x - platform.width/2 && 
                x < platform.x + platform.width/2) {
                validPosition = false;
            }
        });
        
        // 如果位置不合适，尝试找新位置
        if (!validPosition) {
            i--; // 重试
            continue;
        }
        
        // 创建金币
        const coin = coins.create(x, y, 'coin');
        coin.setDisplaySize(16, 16);
        coin.body.setAllowGravity(false); // 确保金币不受重力影响
        coin.body.setImmovable(true); // 使金币不受碰撞影响
        
        // 添加随机的上下浮动效果
        const floatHeight = Phaser.Math.Between(COINS.FLOAT_HEIGHT_MIN, COINS.FLOAT_HEIGHT_MAX);
        const floatDuration = Phaser.Math.Between(COINS.FLOAT_DURATION_MIN, COINS.FLOAT_DURATION_MAX);
        const startDelay = Phaser.Math.Between(0, 1000); // 添加随机延迟以增加错落感
        
        // 创建浮动动画，但延迟开始以创造错落效果
        this.time.delayedCall(startDelay, () => {
            if (coin.active) { // 确保金币仍然存在
                this.tweens.add({
                    targets: coin,
                    y: coin.y - floatHeight,
                    duration: floatDuration,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1,
                    onUpdate: function() {
                        // 确保物理体位置和显示位置同步
                        if (coin.body && coin.active) {
                            coin.body.position.y = coin.y - coin.height / 2;
                        }
                    }
                });
            }
        });
        
        // 随机添加旋转效果 (有50%概率旋转)
        if (Math.random() > 0.5) {
            this.tweens.add({
                targets: coin,
                angle: 360,
                duration: Phaser.Math.Between(2000, 4000),
                repeat: -1
            });
        }
    }

    // 创建索尼克角色
    sonic = this.physics.add.sprite(100, 100, 'sonic');
    sonic.setDisplaySize(32, 32);
    sonic.setBounce(PLAYER.BOUNCE); // 使用配置中的弹跳值
    sonic.setCollideWorldBounds(true);
    
    // 设置更小的碰撞箱
    sonic.body.setSize(16, 24);
    sonic.body.setOffset(8, 8);

    // 设置摄像机跟随索尼克
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(sonic);
    this.cameras.main.setFollowOffset(-200, 0);  // 稍微向前偏移，这样可以看到更多前方的内容

    // 等待一帧让物理引擎初始化完成
    this.physics.world.on('worldstep', function() {
        if (!gameStarted) {
            gameStarted = true;
        }
    }, this);

    // 创建动画
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('sonic', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'sonic', frame: 4 } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('sonic', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    // 添加碰撞检测
    this.physics.add.collider(sonic, platforms, function() {
        // 当角色着地时重置跳跃状态
        if (sonic.body.touching.down) {
            isJumping = false;
            canDoubleJump = false;
            hasDoubleJumped = false;
            // 记录角色着地时间，用于小悬崖宽容
            lastOnGround = Date.now();
        }
    });
    
    // 怪物与平台碰撞
    this.physics.add.collider(enemies, platforms);
    
    // 金币不与平台碰撞，以便让它们悬浮
    // this.physics.add.collider(coins, platforms);
    
    // 仅在游戏开始后添加危险碰撞
    this.time.delayedCall(1000, () => {
        this.physics.add.collider(sonic, spikes, hitSpike, null, this);
        // 添加与怪物的碰撞
        this.physics.add.collider(sonic, enemies, hitEnemy, null, this);
    });
    
    // 改用overlap来检测金币收集 - 这样可以穿过金币并收集它
    this.physics.add.overlap(sonic, coins, collectCoin, null, this);

    // 初始化键盘控制
    cursors = this.input.keyboard.createCursorKeys();

    // 添加分数显示 - 固定到摄像机
    scoreText = this.add.text(16, 16, '分数: 0', { 
        fontSize: '32px', 
        fill: '#000' 
    }).setScrollFactor(0);  // 设置为不随摄像机滚动

    // 添加金币计数显示 - 固定到摄像机
    coinText = this.add.text(16, 50, '金币: 0', { 
        fontSize: '32px', 
        fill: '#000' 
    }).setScrollFactor(0);  // 设置为不随摄像机滚动
    
    // 添加生命值显示 - 固定到摄像机
    healthText = this.add.text(16, 84, '生命: 3', { 
        fontSize: '32px', 
        fill: '#000' 
    }).setScrollFactor(0);

    // 添加开始游戏提示 - 固定到摄像机
    let startText = this.add.text(300, 200, '按上箭头开始', { 
        fontSize: '32px', 
        fill: '#000' 
    }).setScrollFactor(0);  // 设置为不随摄像机滚动
    
    // 监听一次按键事件后删除提示文本
    this.input.keyboard.once('keydown-UP', function() {
        startText.destroy();
    });

    // 监听跳跃事件 - 优化跳跃控制
    this.input.keyboard.on('keydown-UP', function() {
        // 如果在地面上或者在小悬崖宽容时间内
        if (sonic.body.touching.down || coyoteTime) {
            // 首次跳跃
            sonic.setVelocityY(-PLAYER.JUMP_FORCE); // 使用配置中的跳跃力度
            isJumping = true;
            canDoubleJump = true;
            hasDoubleJumped = false;
            coyoteTime = false; // 使用后清除小悬崖宽容状态
            if (coyoteTimer) {
                clearTimeout(coyoteTimer);
                coyoteTimer = null;
            }
        } else if (canDoubleJump && !hasDoubleJumped) {
            // 二段跳
            sonic.setVelocityY(-PLAYER.DOUBLE_JUMP_FORCE); // 使用配置中的二段跳力度
            hasDoubleJumped = true;
        }
    });

    // 增加一个缓冲跳跃系统，实现落地后迅速跳跃的缓冲
    // 当按下跳跃键时设置跳跃缓冲
    this.input.keyboard.on('keydown-UP', function() {
        // 设置跳跃缓冲
        jumpBuffer = true;
        
        // 清除任何现有的缓冲计时器
        if (jumpBufferTimer) {
            clearTimeout(jumpBufferTimer);
        }
        
        // 设置新的计时器，使用配置中的缓冲时间
        jumpBufferTimer = setTimeout(() => {
            jumpBuffer = false;
        }, JUMP.BUFFER_TIME);
    });

    // 添加冲刺专用按键 (使用Z键)
    dashKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    
    // 重置冲刺相关变量
    isDashing = false;
    canDash = true;
    dashDirection = 0;
    leftPressTime = 0;
    rightPressTime = 0;
    leftKeyPressed = false;
    rightKeyPressed = false;
    leftTapCount = 0;
    rightTapCount = 0;
    
    // 监听方向键按下事件
    this.input.keyboard.on('keydown-LEFT', function() {
        if (!leftKeyPressed) {
            leftKeyPressed = true;
            handleDirectionKeyPress('left');
        }
    });
    
    this.input.keyboard.on('keydown-RIGHT', function() {
        if (!rightKeyPressed) {
            rightKeyPressed = true;
            handleDirectionKeyPress('right');
        }
    });
    
    // 监听方向键释放事件
    this.input.keyboard.on('keyup-LEFT', function() {
        leftKeyPressed = false;
    });
    
    this.input.keyboard.on('keyup-RIGHT', function() {
        rightKeyPressed = false;
    });
    
    // 创建冲刺粒子效果
    dashParticles = this.add.particles('coin').createEmitter({
        x: 0,
        y: 0,
        speed: { min: -100, max: 100 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.2, end: 0 },
        lifespan: 300,
        blendMode: 'ADD',
        on: false // 默认关闭
    });
    
    // 添加冲刺计量条 - 固定到摄像机
    this.dashMeter = this.add.graphics().setScrollFactor(0);
    updateDashMeter(this, 1); // 初始化为满
    
    // 添加冲刺文本提示
    this.add.text(16, 118, '冲刺: ', { 
        fontSize: '32px', 
        fill: '#000' 
    }).setScrollFactor(0);
}

function update() {
    if (gameOver) {
        return;
    }

    // 处理小悬崖宽容时间 - 如果刚离开平台
    const now = Date.now();
    if (!sonic.body.touching.down && !isJumping && now - lastOnGround <= JUMP.COYOTE_TIME) {
        // 在小悬崖宽容时间内
        coyoteTime = true;
        
        // 如果没有计时器，设置一个
        if (!coyoteTimer) {
            coyoteTimer = setTimeout(() => {
                coyoteTime = false;
                coyoteTimer = null;
            }, JUMP.COYOTE_TIME);
        }
    }

    // 处理跳跃缓冲 - 如果有跳跃缓冲且角色刚落地
    if (jumpBuffer && (sonic.body.touching.down || coyoteTime) && !isJumping) {
        sonic.setVelocityY(-PLAYER.JUMP_FORCE);
        isJumping = true;
        canDoubleJump = true;
        hasDoubleJumped = false;
        jumpBuffer = false; // 使用后清除缓冲
        coyoteTime = false; // 使用后清除小悬崖宽容状态
        if (coyoteTimer) {
            clearTimeout(coyoteTimer);
            coyoteTimer = null;
        }
    }

    // 检查专用冲刺按键
    if (Phaser.Input.Keyboard.JustDown(dashKey) && canDash && !isDashing) {
        // 使用当前移动方向作为冲刺方向，如果没有移动则使用面向方向
        let direction = 0;
        if (sonic.body.velocity.x > 0) {
            direction = 1;
        } else if (sonic.body.velocity.x < 0) {
            direction = -1;
        } else {
            // 如果没有移动，使用角色面向的方向
            direction = (sonic.flipX) ? -1 : 1;
        }
        
        // 只有在有方向的情况下才冲刺
        if (direction !== 0) {
            startDash(this, direction);
        }
    }
    
    // 更新冲刺冷却进度条
    if (!canDash && dashCooldown) {
        if (dashCooldown.getProgress) {
            let progress = dashCooldown.getProgress();
            updateDashMeter(this, progress);
        } else {
            let elapsed = dashCooldown.getElapsed();
            let progress = Math.min(elapsed / DASH.COOLDOWN, 1);
            updateDashMeter(this, progress);
        }
    }
    
    // 处理冲刺粒子跟随
    if (isDashing) {
        dashParticles.setPosition(sonic.x - dashDirection * 10, sonic.y);
    }
    
    // 处理键盘输入 - 移除旧的冲刺检测代码，只保留基本移动控制
    if (!isDashing) { // 冲刺时不允许常规移动控制
        if (cursors.left.isDown) {
            // 添加水平加速度而不是立即设定速度
            if (sonic.body.velocity.x > -PLAYER.MOVE_SPEED) {
                sonic.setVelocityX(Math.max(sonic.body.velocity.x - PLAYER.ACCELERATION, -PLAYER.MOVE_SPEED));
            }
            sonic.anims.play('left', true);
            sonic.flipX = true; // 确保精灵翻转以面向正确方向
        }
        else if (cursors.right.isDown) {
            // 添加水平加速度而不是立即设定速度
            if (sonic.body.velocity.x < PLAYER.MOVE_SPEED) {
                sonic.setVelocityX(Math.min(sonic.body.velocity.x + PLAYER.ACCELERATION, PLAYER.MOVE_SPEED));
            }
            sonic.anims.play('right', true);
            sonic.flipX = false; // 确保精灵翻转以面向正确方向
        }
        else {
            // 缓慢减速而不是立即停止
            if (sonic.body.velocity.x > 0) {
                sonic.setVelocityX(Math.max(sonic.body.velocity.x - PLAYER.DECELERATION, 0));
            } else if (sonic.body.velocity.x < 0) {
                sonic.setVelocityX(Math.min(sonic.body.velocity.x + PLAYER.DECELERATION, 0));
            }
            
            if (Math.abs(sonic.body.velocity.x) < PLAYER.DECELERATION) {
                sonic.setVelocityX(0);
            }
            
            sonic.anims.play('turn');
        }
    }

    // 空中控制优化 - 在空中时移动速度略有减慢
    if (!sonic.body.touching.down && (cursors.left.isDown || cursors.right.isDown)) {
        // 在空中时提供较少的加速度控制
        if (cursors.left.isDown && sonic.body.velocity.x > -PLAYER.AIR_MOVE_SPEED) {
            sonic.setVelocityX(Math.max(sonic.body.velocity.x - PLAYER.ACCELERATION/2, -PLAYER.AIR_MOVE_SPEED));
        } else if (cursors.right.isDown && sonic.body.velocity.x < PLAYER.AIR_MOVE_SPEED) {
            sonic.setVelocityX(Math.min(sonic.body.velocity.x + PLAYER.ACCELERATION/2, PLAYER.AIR_MOVE_SPEED));
        }
    }
    
    // 更新怪物移动
    if (enemies) {
        enemies.children.iterate(function(enemy) {
            if (!enemy || !enemy.active) return;
            
            // 检查怪物是否到达平台边界
            if (enemy.x <= enemy.platformBounds.left) {
                enemy.direction = 1; // 向右移动
                enemy.setVelocityX(enemy.moveSpeed);
            } else if (enemy.x >= enemy.platformBounds.right) {
                enemy.direction = -1; // 向左移动
                enemy.setVelocityX(-enemy.moveSpeed);
            }
            
            // 如果怪物速度为0（可能卡住），重新设置速度
            if (enemy.body.velocity.x === 0) {
                enemy.setVelocityX(enemy.direction * enemy.moveSpeed);
            }
        });
    }

    // 只有在游戏开始后才更新分数
    if (gameStarted) {
        score += SCORE.BASE_SCORE;
        scoreText.setText('分数: ' + score);
    }

    // 检查游戏结束条件 - 只有当角色完全离开屏幕底部时才结束
    if (sonic.y > 650) {
        health = 0; // 掉落时直接失去所有生命
        updateHealthDisplay();
        endGame(this);
    }
}

function collectCoin(player, coin) {
    // 禁用金币的物理体和隐藏它
    coin.disableBody(true, true);
    
    // 增加金币计数
    coinCount += 1;
    coinText.setText('金币: ' + coinCount);
    
    // 添加金币收集效果
    player.setTint(0xffff00);  // 角色短暂变黄色
    
    // 300毫秒后恢复颜色
    player.scene.time.delayedCall(300, () => {
        if (!isHurt && !isDashing) { // 只有在不受伤和不冲刺时才恢复颜色
            player.clearTint();
        }
    });
    
    // 增加分数
    score += SCORE.COIN_SCORE;
    scoreText.setText('分数: ' + score);
    
    // 所有金币收集完后，生成新的随机位置金币
    if (coins.countActive(true) === 0) {
        // 随机生成新的金币
        for (let i = 0; i < COINS.RESPAWN_COUNT; i++) {
            // 随机选择金币的位置
            let x = Phaser.Math.Between(50, WORLD_WIDTH - 50);
            let y = Phaser.Math.Between(COINS.MIN_HEIGHT, COINS.MAX_HEIGHT);
            
            // 确保不会生成在玩家附近
            if (Math.abs(x - sonic.x) < 200 && Math.abs(y - sonic.y) < 200) {
                i--; // 重试
                continue;
            }
            
            let newCoin = coins.create(x, y, 'coin');
            newCoin.setDisplaySize(16, 16);
            newCoin.body.setAllowGravity(false);
            newCoin.body.setImmovable(true);
            
            // 添加随机的上下浮动效果
            const floatHeight = Phaser.Math.Between(COINS.FLOAT_HEIGHT_MIN, COINS.FLOAT_HEIGHT_MAX);
            const floatDuration = Phaser.Math.Between(COINS.FLOAT_DURATION_MIN, COINS.FLOAT_DURATION_MAX);
            
            player.scene.tweens.add({
                targets: newCoin,
                y: newCoin.y - floatHeight,
                duration: floatDuration,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1,
                onUpdate: function() {
                    if (newCoin.body && newCoin.active) {
                        newCoin.body.position.y = newCoin.y - newCoin.height / 2;
                    }
                }
            });
            
            // 随机添加旋转效果 (有50%概率旋转)
            if (Math.random() > 0.5) {
                player.scene.tweens.add({
                    targets: newCoin,
                    angle: 360,
                    duration: Phaser.Math.Between(2000, 4000),
                    repeat: -1
                });
            }
        }
    }
}

function hitSpike(player, spike) {
    handleHit(player, spike);
}

function hitEnemy(player, enemy) {
    // 如果玩家从上方跳到怪物头上
    if (player.body.touching.down && enemy.body.touching.up) {
        // 消灭怪物
        enemy.disableBody(true, true);
        
        // 玩家反弹
        player.setVelocityY(-300);
        
        // 增加分数，使用配置中的分数值
        score += SCORE.ENEMY_SCORE;
        scoreText.setText('分数: ' + score);
    } else {
        // 否则玩家受伤
        handleHit(player, enemy);
    }
}

// 通用的受伤处理函数
function handleHit(player, hazard) {
    // 如果已经处于受伤状态，不重复计算伤害
    if (isHurt) {
        // 冲刺时碰撞敌人会消灭它们
        if (isDashing && hazard.texture.key === 'enemy') {
            hazard.disableBody(true, true);
            // 增加分数，使用配置中的分数值
            score += SCORE.DASH_ENEMY_SCORE;
            scoreText.setText('分数: ' + score);
        }
        return;
    }
    
    // 减少生命值
    health--;
    updateHealthDisplay();
    
    // 设置受伤状态
    isHurt = true;
    
    // 受伤效果
    player.setTint(0xff0000);
    
    // 受伤后短暂无敌并有击退效果，使用配置中的击退力度
    const knockbackDirection = player.x < hazard.x ? -1 : 1;
    player.setVelocity(knockbackDirection * COMBAT.KNOCKBACK_FORCE, -COMBAT.KNOCKBACK_FORCE);
    
    // 受伤后无敌时间，使用配置中的无敌时间
    player.scene.time.delayedCall(COMBAT.INVINCIBILITY_TIME, () => {
        // 只有在不处于冲刺状态时才取消受伤状态
        if (!isDashing) {
            player.clearTint();
            isHurt = false;
        }
    });
    
    // 检查是否生命值耗尽
    if (health <= 0) {
        endGame(player.scene);
    }
}

// 更新生命值显示
function updateHealthDisplay() {
    healthText.setText('生命: ' + health);
}

function endGame(scene) {
    if (!gameOver) {
        gameOver = true;
        scene.physics.pause();
        sonic.setTint(0xff0000);
        sonic.anims.play('turn');
        
        // 添加游戏结束文本 - 固定到摄像机
        scene.add.text(scene.cameras.main.midPoint.x - 150, 250, '游戏结束', { 
            fontSize: '64px', 
            fill: '#000' 
        }).setScrollFactor(0);
        
        // 添加重新开始按钮 - 固定到摄像机
        let restartButton = scene.add.text(scene.cameras.main.midPoint.x - 50, 350, '重新开始', { 
            fontSize: '32px', 
            fill: '#000',
            backgroundColor: '#fff',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0);
        
        restartButton.setInteractive();
        restartButton.on('pointerdown', () => {
            scene.scene.restart();
            gameOver = false;
            score = 0;
            coinCount = 0;
            gameStarted = false;
            health = 3; // 重置生命值
        });
    }
}

// 冲刺计量条更新函数
function updateDashMeter(scene, fillPercent) {
    scene.dashMeter.clear();
    
    // 背景
    scene.dashMeter.fillStyle(0x666666);
    scene.dashMeter.fillRect(90, 130, 100, 15);
    
    // 填充
    if (fillPercent > 0) {
        if (canDash) {
            scene.dashMeter.fillStyle(0x00ff00); // 可冲刺时为绿色
        } else {
            scene.dashMeter.fillStyle(0xffcc00); // 冷却中为黄色
        }
        scene.dashMeter.fillRect(90, 130, 100 * fillPercent, 15);
    }
    
    // 边框
    scene.dashMeter.lineStyle(2, 0x000000);
    scene.dashMeter.strokeRect(90, 130, 100, 15);
}

// 方向键按下处理函数
function handleDirectionKeyPress(direction) {
    const now = Date.now();
    
    if (direction === 'left') {
        // 记录左键点击
        leftTapCount++;
        
        // 清除之前的计时器
        if (tapTimer) clearTimeout(tapTimer);
        
        // 设置新的计时器，一定时间后重置点击计数
        tapTimer = setTimeout(() => {
            leftTapCount = 0;
            rightTapCount = 0;
        }, doubleTapWindow);
        
        // 如果在短时间内点击了两次左键，触发左冲刺
        if (leftTapCount >= 2 && canDash && !isDashing) {
            startDash(sonic.scene, -1);
            leftTapCount = 0;
        }
    } else if (direction === 'right') {
        // 记录右键点击
        rightTapCount++;
        
        // 清除之前的计时器
        if (tapTimer) clearTimeout(tapTimer);
        
        // 设置新的计时器，一定时间后重置点击计数
        tapTimer = setTimeout(() => {
            leftTapCount = 0;
            rightTapCount = 0;
        }, doubleTapWindow);
        
        // 如果在短时间内点击了两次右键，触发右冲刺
        if (rightTapCount >= 2 && canDash && !isDashing) {
            startDash(sonic.scene, 1);
            rightTapCount = 0;
        }
    }
}

// 启动冲刺函数
function startDash(scene, direction) {
    if (!canDash || isDashing || isHurt) return;
    
    isDashing = true;
    canDash = false;
    dashDirection = direction;
    
    // 设置冲刺速度，使用配置中的冲刺速度
    sonic.setVelocityX(direction * DASH.SPEED);
    
    // 冲刺时临时无敌状态，与受伤状态分开
    const originalHurtState = isHurt;
    isHurt = true;
    
    // 冲刺视觉效果
    sonic.setTint(0x00ffff); // 蓝色
    
    // 启动粒子效果
    dashParticles.setPosition(sonic.x, sonic.y);
    dashParticles.setSpeed({ min: -100 * direction, max: -50 * direction });
    dashParticles.start();
    
    // 显示冲刺提示文字
    const dashText = scene.add.text(sonic.x, sonic.y - 50, '冲刺!', {
        fontSize: '24px',
        fill: '#00ffff'
    }).setOrigin(0.5);
    
    // 文字淡出并消失
    scene.tweens.add({
        targets: dashText,
        alpha: 0,
        y: dashText.y - 30,
        duration: 500,
        onComplete: function() {
            dashText.destroy();
        }
    });
    
    // 冲刺结束，使用配置中的冲刺持续时间
    scene.time.delayedCall(DASH.DURATION, function() {
        isDashing = false;
        dashParticles.stop();
        sonic.clearTint();
        
        // 恢复到原来的受伤状态，除非当前正在受伤
        isHurt = originalHurtState;
        
        // 设置冲刺冷却
        updateDashMeter(scene, 0);
        
        if (dashCooldown) {
            dashCooldown.remove(); // 移除旧的计时器
        }
        
        // 使用配置中的冷却时间
        dashCooldown = scene.time.addEvent({
            delay: DASH.COOLDOWN,
            callback: function() {
                canDash = true;
                updateDashMeter(scene, 1);
            },
            callbackScope: scene
        });
    });
    
    // 冲刺过程中定期更新粒子位置
    let dashUpdateEvent = scene.time.addEvent({
        delay: 50,
        repeat: Math.floor(DASH.DURATION / 50) - 1,
        callback: function() {
            if (isDashing) {
                dashParticles.setPosition(sonic.x - direction * 10, sonic.y);
            }
        }
    });
} 