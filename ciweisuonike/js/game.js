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
let enemyBullets; // 敌人子弹组
let flyingEnemies; // 飞行敌人组
let bulletEvents = []; // 敌人发射子弹的计时器数组
let powerups; // 能力升级道具组
let activePowerups = {}; // 激活的能力升级
let powerupTimers = {}; // 能力升级计时器
let powerupText; // 显示当前能力升级状态的文本

// Boss相关变量
let boss; // Boss对象
let bossHealth; // Boss当前血量
let bossHealthBar; // Boss血条
let bossPhase = 1; // Boss当前阶段
let bossAttackTimers = {}; // Boss攻击计时器
let bossActive = false; // Boss是否激活
let isBossFight = false; // 是否正在Boss战
let bossProjectiles; // Boss发射的投射物
let bossMinions; // Boss召唤的小怪
let bossLaser; // Boss的激光攻击
let bossTrigger; // 触发Boss战的区域

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
    this.load.image('bullet', 'assets/spike.png'); // 使用尖刺图片作为子弹图片
    this.load.image('flyingEnemy', 'assets/spike.png'); // 使用尖刺图片作为飞行敌人图片
    this.load.image('powerup', 'assets/coin.png'); // 临时使用金币图片作为能力升级图片
    this.load.image('boss', 'assets/spike.png'); // 临时使用尖刺图片作为Boss图片
    this.load.image('bossMinion', 'assets/spike.png'); // Boss小怪
    this.load.image('bossBullet', 'assets/spike.png'); // Boss子弹
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
    
    // 创建敌人子弹组
    enemyBullets = this.physics.add.group({
        allowGravity: false // 子弹不受重力影响
    });
    
    // 创建飞行敌人组
    flyingEnemies = this.physics.add.group({
        allowGravity: false // 飞行敌人不受重力影响
    });
    
    // 创建能力升级道具组
    powerups = this.physics.add.group({
        allowGravity: false // 能力升级道具不受重力影响
    });
    
    // 创建Boss投射物组
    bossProjectiles = this.physics.add.group({
        allowGravity: false // Boss投射物不受重力影响
    });
    
    // 创建Boss小怪组
    bossMinions = this.physics.add.group();
    
    // 在世界末端创建Boss触发区域
    bossTrigger = this.physics.add.sprite(WORLD.WIDTH - 600, 300, 'bullet');
    bossTrigger.setAlpha(0); // 隐藏图像
    bossTrigger.body.setAllowGravity(false);
    bossTrigger.setImmovable(true);
    
    // 创建触发区域碰撞检测
    this.physics.add.overlap(sonic, bossTrigger, startBossFight, null, this);
    
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
            
            // 随机选择是否为发射子弹的敌人类型
            if (Math.random() < ENEMIES.BULLETS.SHOOTER_RATIO) {
                enemy.canShoot = true;
                enemy.setTint(0xffaa00); // 黄色标记能发射子弹的敌人
                // 将敌人稍微放大一点以突出显示
                enemy.setDisplaySize(36, 36);
                
                // 设置定时发射子弹
                const bulletEvent = this.time.addEvent({
                    delay: ENEMIES.BULLETS.FIRE_INTERVAL,
                    callback: function() {
                        if (enemy.active && enemy.canShoot) {
                            fireEnemyBullet(this, enemy);
                        }
                    },
                    callbackScope: this,
                    loop: true
                });
                
                // 存储事件引用以便后续清理
                bulletEvents.push(bulletEvent);
            }
        }
    });
    
    // 在空中随机生成飞行敌人
    for (let i = 0; i < 10; i++) {
        const x = Phaser.Math.Between(300, WORLD_WIDTH - 300);
        const y = Phaser.Math.Between(100, 300); // 控制飞行敌人的高度范围
        
        // 只在通过随机几率判断时生成
        if (Math.random() < ENEMIES.FLYING.SPAWN_CHANCE) {
            createFlyingEnemy(this, x, y);
        }
    }

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
        // 添加与飞行敌人的碰撞
        this.physics.add.collider(sonic, flyingEnemies, hitFlyingEnemy, null, this);
        // 添加与敌人子弹的碰撞
        this.physics.add.collider(sonic, enemyBullets, hitEnemyBullet, null, this);
    });
    
    // 改用overlap来检测金币收集 - 这样可以穿过金币并收集它
    this.physics.add.overlap(sonic, coins, collectCoin, null, this);
    
    // 添加能力升级道具的收集检测
    this.physics.add.overlap(sonic, powerups, collectPowerup, null, this);

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

    // 添加能力升级状态显示
    powerupText = this.add.text(16, 118, '能力: 无', { 
        fontSize: '24px', 
        fill: '#0088ff' 
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
    this.add.text(16, 150, '冲刺: ', { 
        fontSize: '32px', 
        fill: '#000' 
    }).setScrollFactor(0);
    
    // 定时生成能力升级道具
    this.time.addEvent({
        delay: 15000, // 每15秒
        callback: spawnRandomPowerup,
        callbackScope: this,
        loop: true
    });
    
    // 初始生成一个能力升级道具
    this.time.delayedCall(5000, () => {
        spawnRandomPowerup(this);
    });

    // 添加与飞行敌人的碰撞
    this.physics.add.collider(sonic, flyingEnemies, hitFlyingEnemy, null, this);
    // 添加与敌人子弹的碰撞
    this.physics.add.collider(sonic, enemyBullets, hitEnemyBullet, null, this);
    
    // 添加Boss相关碰撞
    this.physics.add.collider(sonic, bossProjectiles, hitBossProjectile, null, this);
    this.physics.add.collider(sonic, bossMinions, hitBossMinion, null, this);
    
    // 平台与Boss小怪碰撞
    this.physics.add.collider(bossMinions, platforms);

    // Boss配置
    this.BOSS = {
        MAX_HEALTH: 1000,
        MOVE_SPEED: 80,
        DAMAGE: 30,
        jumpSmash: {
            damage: 50,
            cooldown: 5000,
            chance: 30
        },
        bulletSpray: {
            damage: 20,
            cooldown: 8000,
            chance: 40,
            bulletCount: 8
        },
        dashAttack: {
            damage: 40,
            cooldown: 6000,
            chance: 35
        },
        minionSummon: {
            cooldown: 12000,
            chance: 25,
            count: 3
        },
        laserBeam: {
            damage: 80,
            cooldown: 15000,
            chance: 20
        }
    };
    
    // Boss状态
    this.bossActive = false;
    this.bossHealth = this.BOSS.MAX_HEALTH;
    this.bossPhase = 1;
    this.bossState = 'idle';
    
    // Boss攻击计时器
    this.bossAttackTimers = {
        jumpSmash: 0,
        bulletSpray: 0,
        dashAttack: 0,
        minionSummon: 0,
        laserBeam: 0
    };
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

    // 更新飞行敌人移动
    if (flyingEnemies) {
        flyingEnemies.children.iterate(function(enemy) {
            if (!enemy || !enemy.active) return;
            
            // 检查飞行敌人是否到达世界边界
            if (enemy.x <= 50) {
                enemy.direction = 1; // 向右移动
                enemy.setVelocityX(enemy.moveSpeed);
            } else if (enemy.x >= WORLD_WIDTH - 50) {
                enemy.direction = -1; // 向左移动
                enemy.setVelocityX(-enemy.moveSpeed);
            }
            
            // 如果飞行敌人速度为0（可能卡住），重新设置速度
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

    // 如果Boss激活，运行Boss AI
    if (bossActive && boss && boss.active) {
        runBossAI(this);
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
        if (isDashing && (hazard.texture.key === 'enemy' || hazard.texture.key === 'flyingEnemy')) {
            hazard.disableBody(true, true);
            // 增加分数，使用配置中的分数值
            let scoreValue = hazard.texture.key === 'flyingEnemy' ? SCORE.FLYING_ENEMY_SCORE : SCORE.ENEMY_SCORE;
            score += scoreValue * 2; // 冲刺击败得双倍分数
            scoreText.setText('分数: ' + score);
        }
        return;
    }
    
    // 如果有护盾，则不受伤害
    if (activePowerups['SHIELD']) {
        // 显示护盾抵挡效果
        const shieldEffect = player.scene.add.circle(player.x, player.y, 30, POWERUPS.SHIELD.COLOR, 0.7);
        player.scene.tweens.add({
            targets: shieldEffect,
            scale: 2,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                shieldEffect.destroy();
            }
        });
        
        // 如果是敌人，击退它
        if (hazard.texture.key === 'enemy' || hazard.texture.key === 'flyingEnemy') {
            const knockbackDirection = player.x < hazard.x ? 1 : -1;
            hazard.setVelocityX(knockbackDirection * 300);
        }
        
        // 如果是子弹，销毁它
        if (hazard.texture.key === 'bullet') {
            hazard.destroy();
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
        
        // 创建一个UI场景层
        const gameOverUI = scene.add.container(0, 0);
        gameOverUI.setScrollFactor(0); // 确保容器不随摄像机滚动
        
        // 使用固定的屏幕坐标
        const screenCenterX = scene.cameras.main.width / 2;
        const screenCenterY = scene.cameras.main.height / 2;
        
        // 添加半透明黑色遮罩，使游戏结束界面更加突出
        const overlay = scene.add.rectangle(
            screenCenterX,
            screenCenterY,
            scene.cameras.main.width,
            scene.cameras.main.height,
            0x000000, 0.6
        ).setScrollFactor(0);
        gameOverUI.add(overlay);
        
        // 添加游戏结束文本 - 固定到屏幕中心
        const gameOverText = scene.add.text(screenCenterX, 200, '游戏结束', { 
            fontSize: '64px', 
            fill: '#ffffff',
            stroke: '#ff0000',
            strokeThickness: 6,
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 2, stroke: true, fill: true }
        }).setOrigin(0.5).setScrollFactor(0);
        gameOverUI.add(gameOverText);
        
        // 添加最终分数显示
        const scoreText = scene.add.text(screenCenterX, 280, '最终分数: ' + score, { 
            fontSize: '36px', 
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0);
        gameOverUI.add(scoreText);
        
        // 添加收集的金币数量
        const coinText = scene.add.text(screenCenterX, 330, '金币: ' + coinCount, { 
            fontSize: '32px', 
            fill: '#ffff00'
        }).setOrigin(0.5).setScrollFactor(0);
        gameOverUI.add(coinText);
        
        // 简单文本按钮方案
        const restartButton = scene.add.text(screenCenterX, 400, '[ 重新开始 ]', { 
            fontSize: '36px', 
            fill: '#00ff00',
            fontStyle: 'bold',
            backgroundColor: '#004400',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });
        gameOverUI.add(restartButton);
        
        // 悬停效果
        restartButton.on('pointerover', () => {
            restartButton.setStyle({ 
                fill: '#ffffff',
                fontSize: '38px'
            });
        });
        
        restartButton.on('pointerout', () => {
            restartButton.setStyle({ 
                fill: '#00ff00', 
                fontSize: '36px'
            });
        });
        
        // 点击重启游戏
        restartButton.on('pointerdown', () => {
            scene.scene.restart();
            gameOver = false;
            score = 0;
            coinCount = 0;
            gameStarted = false;
            health = 3; // 重置生命值
        });
        
        // 添加按键提示文本
        const spaceText = scene.add.text(screenCenterX, 460, '按空格键重新开始', { 
            fontSize: '24px', 
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0);
        gameOverUI.add(spaceText);
        
        // 确保游戏结束UI在最上层
        gameOverUI.setDepth(10000);
        
        // 添加键盘空格键重新开始功能
        scene.input.keyboard.once('keydown-SPACE', () => {
            scene.scene.restart();
            gameOver = false;
            score = 0;
            coinCount = 0;
            gameStarted = false;
            health = 3; // 重置生命值
        });
        
        // 添加死亡动画效果
        scene.tweens.add({
            targets: gameOverText,
            y: 180,
            duration: 1500,
            ease: 'Bounce',
            yoyo: true,
            repeat: -1
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

// 创建花朵式扩散子弹
function fireEnemyBullet(scene, enemy) {
    const bulletCount = ENEMIES.BULLETS.COUNT;
    const angleStep = 360 / bulletCount;
    
    // 在玩家太远的时候不发射子弹
    if (Math.abs(enemy.x - sonic.x) > ENEMIES.BULLETS.MAX_DETECT_DISTANCE) {
        return;
    }

    // 创建多个子弹，围成圆形
    for (let i = 0; i < bulletCount; i++) {
        const angle = i * angleStep;
        // 转换角度为弧度
        const rad = Phaser.Math.DegToRad(angle);
        
        // 创建子弹
        const bullet = enemyBullets.create(enemy.x, enemy.y, 'bullet');
        bullet.setDisplaySize(20, 20);
        bullet.setTint(0xff00ff); // 紫色
        
        // 设置子弹速度
        const velocityX = Math.cos(rad) * ENEMIES.BULLETS.SPEED;
        const velocityY = Math.sin(rad) * ENEMIES.BULLETS.SPEED;
        bullet.setVelocity(velocityX, velocityY);
        
        // 设置子弹旋转动画
        scene.tweens.add({
            targets: bullet,
            angle: 360,
            duration: 1000,
            repeat: -1
        });
        
        // 设置子弹生命周期
        scene.time.delayedCall(ENEMIES.BULLETS.LIFETIME, () => {
            if (bullet.active) {
                bullet.destroy();
            }
        });
    }
    
    // 添加子弹发射效果
    enemy.setTint(0xffffff); // 发射时短暂变白色
    
    // 添加闪光效果
    const flash = scene.add.circle(enemy.x, enemy.y, 25, 0xff00ff, 0.7);
    scene.tweens.add({
        targets: flash,
        alpha: 0,
        scale: 1.5,
        duration: 300,
        onComplete: function() {
            flash.destroy();
        }
    });
    
    scene.time.delayedCall(200, () => {
        if (enemy.active && enemy.canShoot) {
            enemy.setTint(0xffaa00); // 恢复原来的颜色
        }
    });
}

// 创建飞行敌人
function createFlyingEnemy(scene, x, y) {
    const flyingEnemy = flyingEnemies.create(x, y, 'flyingEnemy');
    flyingEnemy.setDisplaySize(32, 32);
    flyingEnemy.setTint(0x00aaff); // 设置蓝色色调
    flyingEnemy.setCollideWorldBounds(true);
    
    // 随机设置飞行敌人的移动方向和速度
    flyingEnemy.direction = Math.random() > 0.5 ? 1 : -1;
    flyingEnemy.moveSpeed = Phaser.Math.Between(
        ENEMIES.FLYING.MOVE_SPEED_MIN, 
        ENEMIES.FLYING.MOVE_SPEED_MAX
    );
    flyingEnemy.setVelocityX(flyingEnemy.direction * flyingEnemy.moveSpeed);
    
    // 存储初始Y坐标
    flyingEnemy.startY = y;
    
    // 上下飞行动画
    scene.tweens.add({
        targets: flyingEnemy,
        y: y + ENEMIES.FLYING.AMPLITUDE,
        duration: ENEMIES.FLYING.PERIOD / 2,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
    });
    
    // 添加旋转动画
    scene.tweens.add({
        targets: flyingEnemy,
        angle: flyingEnemy.direction * 360, // 根据移动方向决定旋转方向
        duration: 3000,
        repeat: -1
    });
    
    // 随机决定是否是发射子弹的飞行敌人 (30%几率)
    if (Math.random() < 0.5) {
        flyingEnemy.canShoot = true;
        flyingEnemy.setTint(0x00ffaa); // 绿蓝色标记能发射子弹的飞行敌人
        // 稍微增大尺寸以便更醒目
        flyingEnemy.setDisplaySize(36, 36);
        
        // 设置定时发射子弹
        const bulletEvent = scene.time.addEvent({
            delay: ENEMIES.BULLETS.FIRE_INTERVAL * 1.2, // 比普通敌人发射频率低
            callback: function() {
                if (flyingEnemy.active && flyingEnemy.canShoot) {
                    fireEnemyBullet(scene, flyingEnemy);
                }
            },
            callbackScope: scene,
            loop: true
        });
        
        // 存储事件引用以便后续清理
        bulletEvents.push(bulletEvent);
    }
    
    return flyingEnemy;
}

// 处理与飞行敌人的碰撞
function hitFlyingEnemy(player, enemy) {
    // 如果玩家从上方跳到怪物头上
    if (player.body.touching.down && enemy.body.touching.up) {
        // 消灭怪物
        enemy.disableBody(true, true);
        
        // 玩家反弹
        player.setVelocityY(-300);
        
        // 增加分数，使用配置中的分数值
        score += SCORE.FLYING_ENEMY_SCORE;
        scoreText.setText('分数: ' + score);
    } else {
        // 否则玩家受伤
        handleHit(player, enemy);
    }
}

// 处理子弹碰撞
function hitEnemyBullet(player, bullet) {
    // 销毁子弹
    bullet.destroy();
    
    // 处理玩家受伤
    handleHit(player, bullet);
}

// 启动Boss战
function startBossFight(player, trigger) {
    // 只触发一次
    if (isBossFight) return;
    
    // 设置Boss战标志
    isBossFight = true;
    
    // 销毁触发器
    trigger.destroy();
    
    // 创建闪屏效果
    const flashScreen = player.scene.add.rectangle(
        player.scene.cameras.main.worldView.x + player.scene.cameras.main.width / 2,
        player.scene.cameras.main.worldView.y + player.scene.cameras.main.height / 2,
        player.scene.cameras.main.width,
        player.scene.cameras.main.height,
        0xffffff
    ).setScrollFactor(0).setDepth(1000);
    
    // 闪屏淡出
    player.scene.tweens.add({
        targets: flashScreen,
        alpha: 0,
        duration: 1000,
        onComplete: () => {
            flashScreen.destroy();
        }
    });
    
    // 显示Boss登场文字
    const bossText = player.scene.add.text(
        player.scene.cameras.main.worldView.x + player.scene.cameras.main.width / 2,
        player.scene.cameras.main.worldView.y + player.scene.cameras.main.height / 2,
        "Boss战斗开始！",
        {
            fontSize: '48px',
            fontStyle: 'bold',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 6,
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 2, fill: true, stroke: true }
        }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(1001);
    
    // 文字动画
    player.scene.tweens.add({
        targets: bossText,
        scale: 1.2,
        duration: 500,
        yoyo: true,
        repeat: 2,
        onComplete: () => {
            bossText.destroy();
            // 创建Boss
            createBoss(player.scene);
        }
    });
}

// 创建Boss
function createBoss(scene) {
    // 创建Boss
    boss = scene.physics.add.sprite(BOSS.SPAWN_X, BOSS.SPAWN_Y, 'boss');
    boss.setDisplaySize(BOSS.SIZE, BOSS.SIZE);
    boss.setCollideWorldBounds(true);
    boss.setBounce(0.2);
    boss.setTint(0xff0000); // 红色Boss
    
    // 设置Boss血量
    bossHealth = BOSS.MAX_HEALTH;
    bossPhase = 1;
    
    // 创建Boss健康条背景
    const healthBarBg = scene.add.rectangle(
        BOSS.SPAWN_X,
        BOSS.SPAWN_Y - BOSS.SIZE/2 - 20,
        BOSS.MAX_HEALTH / 2,
        10,
        0x000000
    );
    
    // 创建Boss健康条
    bossHealthBar = scene.add.rectangle(
        BOSS.SPAWN_X - BOSS.MAX_HEALTH / 4,
        BOSS.SPAWN_Y - BOSS.SIZE/2 - 20,
        BOSS.MAX_HEALTH / 2,
        10,
        0xff0000
    );
    bossHealthBar.setOrigin(0, 0.5);
    
    // 添加Boss名称
    const bossName = scene.add.text(
        BOSS.SPAWN_X,
        BOSS.SPAWN_Y - BOSS.SIZE/2 - 40,
        "机械霸王",
        {
            fontSize: '24px',
            fontStyle: 'bold',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 3
        }
    ).setOrigin(0.5);
    
    // 将血条和名称跟随Boss
    scene.time.addEvent({
        delay: 20,
        callback: () => {
            if (!boss || !boss.active) return;
            
            healthBarBg.setPosition(boss.x, boss.y - BOSS.SIZE/2 - 20);
            bossHealthBar.setPosition(boss.x - bossHealthBar.width / 2, boss.y - BOSS.SIZE/2 - 20);
            bossName.setPosition(boss.x, boss.y - BOSS.SIZE/2 - 40);
        },
        loop: true
    });
    
    // 添加与玩家的碰撞
    scene.physics.add.collider(boss, platforms);
    scene.physics.add.collider(sonic, boss, hitBoss, null, scene);
    
    // 激活Boss
    bossActive = true;
    
    // 开始Boss AI
    runBossAI(scene);
}

// 处理与Boss的碰撞
function hitBoss(player, boss) {
    // 如果玩家从上方跳到Boss头上
    if (player.body.touching.down && boss.body.touching.up) {
        // 减少Boss血量
        damageBoss(20);
        
        // 玩家反弹
        player.setVelocityY(-300);
    } else {
        // 否则玩家受伤
        handleHit(player, boss);
    }
}

// 对Boss造成伤害
function damageBoss(damage) {
    // 减少Boss血量
    bossHealth -= damage;
    
    // 更新Boss血条
    bossHealthBar.width = (bossHealth / BOSS.MAX_HEALTH) * (BOSS.MAX_HEALTH / 2);
    
    // 检查Boss阶段变化
    if (bossHealth <= BOSS.PHASE_HEALTH.PHASE3 && bossPhase < 3) {
        bossPhase = 3;
        transitionBossPhase(3);
    } else if (bossHealth <= BOSS.PHASE_HEALTH.PHASE2 && bossPhase < 2) {
        bossPhase = 2;
        transitionBossPhase(2);
    }
    
    // 检查Boss是否被击败
    if (bossHealth <= 0) {
        defeatedBoss();
    } else {
        // Boss受伤效果
        boss.setTint(0xffffff);
        boss.scene.time.delayedCall(200, () => {
            if (boss && boss.active) {
                boss.setTint(0xff0000);
            }
        });
    }
}

// 运行Boss AI
function runBossAI(scene) {
    // 如果Boss未激活，不执行
    if (!bossActive || !boss || !boss.active) return;
    
    // 更新Boss攻击计时器
    scene.time.addEvent({
        delay: 100,
        callback: () => {
            if (!bossActive || !boss || !boss.active) return;
            
            // 根据当前阶段决定可用的攻击
            let attackTypes = [];
            
            // 阶段1攻击
            if (bossPhase >= 1) {
                attackTypes.push('jumpSmash', 'bulletSpray');
            }
            
            // 阶段2攻击
            if (bossPhase >= 2) {
                attackTypes.push('dashAttack', 'minionSummon');
            }
            
            // 阶段3攻击
            if (bossPhase >= 3) {
                attackTypes.push('laserBeam');
            }
            
            // 随机选择攻击
            for (const attackType of attackTypes) {
                const attackConfig = BOSS.ATTACKS[attackType];
                
                // 检查攻击冷却
                if (!bossAttackTimers[attackType] || scene.time.now > bossAttackTimers[attackType]) {
                    // 概率触发攻击
                    if (Phaser.Math.Between(1, 100) <= attackConfig.CHANCE) {
                        // 执行攻击
                        executeAttack(attackType, scene);
                        
                        // 设置冷却
                        bossAttackTimers[attackType] = scene.time.now + attackConfig.COOLDOWN;
                        
                        // 找到一个攻击后跳出（每次只执行一种攻击）
                        break;
                    }
                }
            }
            
            // 基础AI：跟踪玩家
            if (sonic && boss) {
                // 水平移动朝向玩家
                if (sonic.x < boss.x - 100) {
                    boss.setVelocityX(-BOSS.MOVE_SPEED);
                } else if (sonic.x > boss.x + 100) {
                    boss.setVelocityX(BOSS.MOVE_SPEED);
                } else {
                    boss.setVelocityX(0);
                }
            }
        },
        loop: true
    });
}

// 执行Boss攻击
function executeAttack(attackType, scene) {
    switch (attackType) {
        case 'jumpSmash':
            bossJumpSmash(scene);
            break;
        case 'bulletSpray':
            bossBulletSpray(scene);
            break;
        case 'dashAttack':
            bossDashAttack(scene);
            break;
        case 'minionSummon':
            bossMinionSummon(scene);
            break;
        case 'laserBeam':
            bossLaserBeam(scene);
            break;
    }
}

// Boss跳跃攻击
function bossJumpSmash(scene) {
    if (!boss || !boss.active) return;
    
    // 播放预警动画
    boss.setTint(0xffff00);
    
    scene.time.delayedCall(500, () => {
        if (!boss || !boss.active) return;
        
        // 恢复颜色
        boss.setTint(bossPhase === 3 ? 0xff00ff : 0xff0000);
        
        // 跳跃
        boss.setVelocityY(-BOSS.ATTACKS.jumpSmash.JUMP_FORCE);
        
        // 落地检测
        const smashCheck = scene.time.addEvent({
            delay: 100,
            callback: () => {
                if (!boss || !boss.active) {
                    smashCheck.remove();
                    return;
                }
                
                // 当Boss落地
                if (boss.body.velocity.y === 0 && boss.body.blocked.down) {
                    smashCheck.remove();
                    
                    // 创建地面冲击波
                    const shockwave = scene.add.circle(
                        boss.x,
                        boss.y + BOSS.SIZE/2,
                        10,
                        0xff9900,
                        0.8
                    );
                    
                    // 冲击波动画
                    scene.tweens.add({
                        targets: shockwave,
                        scale: 15,
                        alpha: 0,
                        duration: 1000,
                        onComplete: () => {
                            shockwave.destroy();
                        }
                    });
                    
                    // 如果玩家在地面上且距离较近，造成伤害
                    if (sonic && sonic.active && sonic.body.blocked.down && 
                        Phaser.Math.Distance.Between(sonic.x, sonic.y, boss.x, boss.y) < 300) {
                        handleHit(sonic, boss);
                        
                        // 击飞玩家
                        if (sonic.x < boss.x) {
                            sonic.setVelocity(-300, -200);
                        } else {
                            sonic.setVelocity(300, -200);
                        }
                    }
                }
            },
            loop: true
        });
    });
}

// Boss子弹喷射
function bossBulletSpray(scene) {
    if (!boss || !boss.active) return;
    
    // 播放预警动画
    boss.setTint(0x00ffff);
    
    scene.time.delayedCall(300, () => {
        if (!boss || !boss.active) return;
        
        // 恢复颜色
        boss.setTint(bossPhase === 3 ? 0xff00ff : 0xff0000);
        
        // 子弹数量和间隔取决于阶段
        let bulletCount = BOSS.ATTACKS.bulletSpray.BULLETS;
        let bulletDelay = BOSS.ATTACKS.bulletSpray.DELAY;
        
        // 更高阶段发射更多子弹
        if (bossPhase >= 2) bulletCount += 2;
        if (bossPhase >= 3) {
            bulletCount += 3;
            bulletDelay *= 0.7; // 更快的射速
        }
        
        // 发射子弹
        for (let i = 0; i < bulletCount; i++) {
            scene.time.delayedCall(i * bulletDelay, () => {
                if (!boss || !boss.active) return;
                
                const angle = (i / bulletCount) * 360;
                createBossBullet(scene, angle);
                
                // 在最后一颗子弹发射后
                if (i === bulletCount - 1) {
                    // 如果是第3阶段，发射第二波
                    if (bossPhase === 3) {
                        scene.time.delayedCall(1000, () => {
                            for (let j = 0; j < bulletCount; j++) {
                                scene.time.delayedCall(j * bulletDelay, () => {
                                    if (!boss || !boss.active) return;
                                    
                                    const angle = ((j / bulletCount) * 360) + 180/bulletCount;
                                    createBossBullet(scene, angle);
                                });
                            }
                        });
                    }
                }
            });
        }
    });
}

// 创建Boss子弹
function createBossBullet(scene, angle) {
    // 创建子弹
    const bullet = bossProjectiles.create(boss.x, boss.y, 'bossBullet');
    bullet.setDisplaySize(20, 20);
    bullet.setTint(0xff9900);
    
    // 根据角度设置速度
    const speed = BOSS.ATTACKS.bulletSpray.SPEED;
    const vx = Math.cos(Phaser.Math.DegToRad(angle)) * speed;
    const vy = Math.sin(Phaser.Math.DegToRad(angle)) * speed;
    bullet.setVelocity(vx, vy);
    
    // 设置子弹旋转
    bullet.setAngularVelocity(300);
    
    // 子弹生命周期
    scene.time.delayedCall(3000, () => {
        if (bullet && bullet.active) {
            bullet.destroy();
        }
    });
}

// Boss冲刺攻击
function bossDashAttack(scene) {
    if (!boss || !boss.active || !sonic || !sonic.active) return;
    
    // 播放预警动画
    boss.setTint(0xff6600);
    
    // 保存原始位置
    const originalX = boss.x;
    const originalY = boss.y;
    
    scene.time.delayedCall(1000, () => {
        if (!boss || !boss.active || !sonic || !sonic.active) return;
        
        // 恢复颜色
        boss.setTint(bossPhase === 3 ? 0xff00ff : 0xff0000);
        
        // 计算目标方向
        const angle = Phaser.Math.Angle.Between(boss.x, boss.y, sonic.x, sonic.y);
        
        // 设置冲刺速度
        const dashSpeed = BOSS.ATTACKS.dashAttack.SPEED;
        const vx = Math.cos(angle) * dashSpeed;
        const vy = Math.sin(angle) * dashSpeed;
        
        boss.setVelocity(vx, vy);
        
        // 冲刺尾巴特效
        const dashTrail = scene.time.addEvent({
            delay: 50,
            callback: () => {
                if (!boss || !boss.active) {
                    dashTrail.remove();
                    return;
                }
                
                const trail = scene.add.rectangle(
                    boss.x,
                    boss.y,
                    boss.displayWidth * 0.8,
                    boss.displayHeight * 0.8,
                    0xff6600,
                    0.5
                );
                
                scene.tweens.add({
                    targets: trail,
                    alpha: 0,
                    scale: 0.5,
                    duration: 200,
                    onComplete: () => {
                        trail.destroy();
                    }
                });
            },
            loop: true
        });
        
        // 冲刺结束
        scene.time.delayedCall(1000, () => {
            if (!boss || !boss.active) {
                dashTrail.remove();
                return;
            }
            
            boss.setVelocity(0, 0);
            dashTrail.remove();
        });
    });
}

// Boss召唤小怪
function bossMinionSummon(scene) {
    if (!boss || !boss.active) return;
    
    // 播放预警动画
    boss.setTint(0x00ff00);
    
    // 召唤圈动画
    const summonCircle = scene.add.circle(
        boss.x,
        boss.y,
        boss.displayWidth,
        0x00ff00,
        0.3
    );
    
    scene.tweens.add({
        targets: summonCircle,
        scale: 2,
        alpha: 0,
        duration: 1000,
        onComplete: () => {
            summonCircle.destroy();
        }
    });
    
    scene.time.delayedCall(1000, () => {
        if (!boss || !boss.active) return;
        
        // 恢复颜色
        boss.setTint(bossPhase === 3 ? 0xff00ff : 0xff0000);
        
        // 召唤数量取决于阶段
        let minionCount = BOSS.ATTACKS.minionSummon.COUNT;
        if (bossPhase === 3) minionCount += 2;
        
        // 召唤小怪
        for (let i = 0; i < minionCount; i++) {
            const angle = (i / minionCount) * 360;
            const distance = 150;
            const x = boss.x + Math.cos(Phaser.Math.DegToRad(angle)) * distance;
            const y = boss.y + Math.sin(Phaser.Math.DegToRad(angle)) * distance;
            
            // 创建小怪
            const minion = bossMinions.create(x, y, 'bossMinion');
            minion.setDisplaySize(30, 30);
            minion.setBounce(0.2);
            minion.setCollideWorldBounds(true);
            minion.setTint(0x00ff00);
            
            // 小怪AI：追踪玩家
            const minionAI = scene.time.addEvent({
                delay: 500,
                callback: () => {
                    if (!minion || !minion.active || !sonic || !sonic.active) {
                        minionAI.remove();
                        return;
                    }
                    
                    // 靠近玩家
                    if (sonic.x < minion.x) {
                        minion.setVelocityX(-100);
                    } else {
                        minion.setVelocityX(100);
                    }
                    
                    // 如果在地面上且玩家在上方，尝试跳跃
                    if (minion.body.blocked.down && sonic.y < minion.y - 50) {
                        minion.setVelocityY(-300);
                    }
                },
                loop: true
            });
            
            // 小怪生命周期
            scene.time.delayedCall(BOSS.ATTACKS.minionSummon.LIFETIME, () => {
                if (minion && minion.active) {
                    // 爆炸特效
                    const explosion = scene.add.circle(
                        minion.x,
                        minion.y,
                        30,
                        0x00ff00,
                        0.8
                    );
                    
                    scene.tweens.add({
                        targets: explosion,
                        scale: 2,
                        alpha: 0,
                        duration: 500,
                        onComplete: () => {
                            explosion.destroy();
                        }
                    });
                    
                    minion.destroy();
                    minionAI.remove();
                }
            });
        }
    });
}

// Boss激光攻击
function bossLaserBeam(scene) {
    if (!boss || !boss.active || !sonic || !sonic.active) return;
    
    // 播放预警动画
    boss.setTint(0xff00ff);
    
    // 目标角度：指向玩家
    const targetAngle = Phaser.Math.Angle.Between(boss.x, boss.y, sonic.x, sonic.y);
    
    // 创建瞄准线
    const aimLine = scene.add.line(
        0, 0,
        boss.x, boss.y,
        boss.x + Math.cos(targetAngle) * 1000,
        boss.y + Math.sin(targetAngle) * 1000,
        0xff00ff, 0.5
    ).setOrigin(0, 0).setLineWidth(5);
    
    // 瞄准动画
    scene.tweens.add({
        targets: aimLine,
        alpha: 0.8,
        lineWidth: 10,
        duration: 1000,
        yoyo: true,
        repeat: 2,
        onComplete: () => {
            aimLine.destroy();
            
            if (!boss || !boss.active) return;
            
            // 发射激光
            bossLaser = scene.add.rectangle(
                boss.x, 
                boss.y,
                1000, 
                30,
                0xff00ff,
                0.8
            ).setOrigin(0, 0.5);
            
            // 设置激光角度和位置
            bossLaser.rotation = targetAngle;
            
            // 激光伤害检测
            const laserDamageCheck = scene.time.addEvent({
                delay: 100,
                callback: () => {
                    if (!bossLaser || !bossLaser.active || !sonic || !sonic.active) {
                        laserDamageCheck.remove();
                        return;
                    }
                    
                    // 检查玩家是否在激光范围内
                    const distance = Phaser.Math.Distance.Between(boss.x, boss.y, sonic.x, sonic.y);
                    const angle = Phaser.Math.Angle.Between(boss.x, boss.y, sonic.x, sonic.y);
                    const angleDiff = Phaser.Math.Angle.Wrap(angle - bossLaser.rotation);
                    
                    if (distance < 800 && Math.abs(angleDiff) < 0.2) {
                        handleHit(sonic, boss);
                    }
                },
                loop: true
            });
            
            // 激光持续时间
            scene.time.delayedCall(BOSS.ATTACKS.laserBeam.DURATION, () => {
                if (bossLaser && bossLaser.active) {
                    scene.tweens.add({
                        targets: bossLaser,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => {
                            bossLaser.destroy();
                            laserDamageCheck.remove();
                        }
                    });
                } else {
                    laserDamageCheck.remove();
                }
            });
        }
    });
}

// 处理Boss发射的子弹碰撞
function hitBossProjectile(player, projectile) {
    // 销毁子弹
    projectile.destroy();
    
    // 处理玩家受伤
    handleHit(player, projectile);
}

// 处理Boss小怪碰撞
function hitBossMinion(player, minion) {
    // 处理玩家受伤
    handleHit(player, minion);
    
    // 如果玩家从上方踩到小怪
    if (player.body.touching.down && minion.body.touching.up) {
        // 摧毁小怪
        const explosion = minion.scene.add.circle(
            minion.x,
            minion.y,
            30,
            0x00ff00,
            0.8
        );
        
        minion.scene.tweens.add({
            targets: explosion,
            scale: 2,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        minion.destroy();
        
        // 玩家弹跳
        player.setVelocityY(-300);
    }
}

// 处理能力升级道具收集
function collectPowerup(player, powerup) {
    // 禁用能力升级道具的物理体和隐藏它
    powerup.disableBody(true, true);
    
    // 随机选择一种能力升级类型
    const powerupTypes = Object.keys(POWERUPS);
    const powerupType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
    
    // 清除之前的能力升级计时器
    Object.keys(powerupTimers).forEach(type => {
        if (powerupTimers[type]) {
            powerupTimers[type].remove();
            delete powerupTimers[type];
        }
    });
    
    // 激活能力升级
    activatePowerup(player.scene, powerupType);
    
    // 增加分数
    score += 200; // 能力升级得分
    scoreText.setText('分数: ' + score);
    
    // 添加收集效果
    player.setTint(POWERUPS[powerupType].COLOR);
    
    // 500毫秒后恢复颜色
    player.scene.time.delayedCall(500, () => {
        if (!isHurt && !isDashing) {
            player.clearTint();
        }
    });
}

// 激活能力升级
function activatePowerup(scene, type) {
    // 设置当前能力
    activePowerups[type] = true;
    
    // 更新能力文本
    let powerupName = "无";
    switch(type) {
        case 'SHIELD':
            powerupName = "护盾";
            // 添加护盾效果
            const shield = scene.add.circle(sonic.x, sonic.y, 25, POWERUPS.SHIELD.COLOR, 0.5);
            shield.setDepth(100);
            
            // 更新护盾位置
            scene.time.addEvent({
                delay: 20,
                callback: () => {
                    shield.setPosition(sonic.x, sonic.y);
                },
                repeat: POWERUPS.SHIELD.DURATION / 20
            });
            
            // 护盾消失
            scene.time.delayedCall(POWERUPS.SHIELD.DURATION, () => {
                shield.destroy();
            });
            break;
            
        case 'JUMP_BOOST':
            powerupName = "跳跃提升";
            // 临时提高跳跃力度
            PLAYER.JUMP_FORCE *= POWERUPS.JUMP_BOOST.MULTIPLIER;
            PLAYER.DOUBLE_JUMP_FORCE *= POWERUPS.JUMP_BOOST.MULTIPLIER;
            
            // 添加粒子效果
            const jumpParticles = scene.add.particles('powerup').createEmitter({
                x: sonic.x,
                y: sonic.y,
                speed: { min: -50, max: 50 },
                scale: { start: 0.1, end: 0 },
                lifespan: 300,
                blendMode: 'ADD',
                tint: POWERUPS.JUMP_BOOST.COLOR,
                on: true
            });
            
            // 更新粒子位置
            scene.time.addEvent({
                delay: 20,
                callback: () => {
                    jumpParticles.setPosition(sonic.x, sonic.y + 10);
                },
                repeat: POWERUPS.JUMP_BOOST.DURATION / 20
            });
            
            // 恢复正常跳跃力度
            scene.time.delayedCall(POWERUPS.JUMP_BOOST.DURATION, () => {
                PLAYER.JUMP_FORCE /= POWERUPS.JUMP_BOOST.MULTIPLIER;
                PLAYER.DOUBLE_JUMP_FORCE /= POWERUPS.JUMP_BOOST.MULTIPLIER;
                jumpParticles.stop();
            });
            break;
            
        case 'SPEED_BOOST':
            powerupName = "速度提升";
            // 临时提高移动速度
            PLAYER.MOVE_SPEED *= POWERUPS.SPEED_BOOST.MULTIPLIER;
            PLAYER.AIR_MOVE_SPEED *= POWERUPS.SPEED_BOOST.MULTIPLIER;
            
            // 添加尾迹效果
            const speedTrail = scene.add.particles('powerup').createEmitter({
                x: sonic.x,
                y: sonic.y,
                speed: { min: -80, max: -40 },
                scale: { start: 0.2, end: 0 },
                lifespan: 500,
                blendMode: 'ADD',
                tint: POWERUPS.SPEED_BOOST.COLOR,
                on: true
            });
            
            // 更新尾迹位置
            scene.time.addEvent({
                delay: 20,
                callback: () => {
                    speedTrail.setPosition(sonic.x, sonic.y);
                },
                repeat: POWERUPS.SPEED_BOOST.DURATION / 20
            });
            
            // 恢复正常速度
            scene.time.delayedCall(POWERUPS.SPEED_BOOST.DURATION, () => {
                PLAYER.MOVE_SPEED /= POWERUPS.SPEED_BOOST.MULTIPLIER;
                PLAYER.AIR_MOVE_SPEED /= POWERUPS.SPEED_BOOST.MULTIPLIER;
                speedTrail.stop();
            });
            break;
            
        case 'MAGNET':
            powerupName = "磁铁";
            // 创建磁铁效果区域
            const magnetArea = scene.add.circle(sonic.x, sonic.y, POWERUPS.MAGNET.RADIUS, POWERUPS.MAGNET.COLOR, 0.2);
            magnetArea.setDepth(50);
            
            // 更新磁铁区域位置
            const magnetUpdateEvent = scene.time.addEvent({
                delay: 20,
                callback: () => {
                    magnetArea.setPosition(sonic.x, sonic.y);
                    
                    // 吸引附近的金币
                    if (coins) {
                        coins.children.iterate(function(coin) {
                            if (!coin || !coin.active) return;
                            
                            const dist = Phaser.Math.Distance.Between(sonic.x, sonic.y, coin.x, coin.y);
                            if (dist < POWERUPS.MAGNET.RADIUS) {
                                // 计算方向向量
                                const dirX = sonic.x - coin.x;
                                const dirY = sonic.y - coin.y;
                                const length = Math.sqrt(dirX * dirX + dirY * dirY);
                                
                                // 设置金币移动速度（越近越快）
                                const speed = 5 + (POWERUPS.MAGNET.RADIUS - dist) / 10;
                                
                                // 更新金币位置
                                coin.x += (dirX / length) * speed;
                                coin.y += (dirY / length) * speed;
                                
                                // 更新物理体位置
                                if (coin.body) {
                                    coin.body.position.x = coin.x - coin.width / 2;
                                    coin.body.position.y = coin.y - coin.height / 2;
                                }
                            }
                        });
                    }
                },
                repeat: POWERUPS.MAGNET.DURATION / 20
            });
            
            // 磁铁效果结束
            scene.time.delayedCall(POWERUPS.MAGNET.DURATION, () => {
                magnetArea.destroy();
                magnetUpdateEvent.remove();
            });
            break;
            
        default:
            powerupName = "无";
    }
    
    // 更新能力文本
    powerupText.setText('能力: ' + powerupName);
    
    // 设置能力失效计时器
    powerupTimers[type] = scene.time.delayedCall(POWERUPS[type].DURATION, () => {
        // 能力失效
        delete activePowerups[type];
        delete powerupTimers[type];
        
        // 如果没有激活的能力，更新文本
        if (Object.keys(activePowerups).length === 0) {
            powerupText.setText('能力: 无');
        }
    });
}

// 生成随机能力升级道具
function spawnRandomPowerup(scene) {
    // 随机选择一个位置（确保不在玩家附近）
    let x, y;
    let validPosition = false;
    
    while (!validPosition) {
        // 随机位置
        x = Phaser.Math.Between(100, WORLD_WIDTH - 100);
        y = Phaser.Math.Between(100, 400);
        
        // 确保不会生成在玩家附近
        if (Math.abs(x - sonic.x) > 200 && Math.abs(y - sonic.y) > 100) {
            validPosition = true;
        }
    }
    
    // 创建能力升级道具
    const powerup = powerups.create(x, y, 'powerup');
    powerup.setDisplaySize(30, 30);
    powerup.body.setAllowGravity(false); // 确保道具不受重力影响
    
    // 随机颜色（基于可能的能力类型）
    const powerupTypes = Object.keys(POWERUPS);
    const randomType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
    powerup.setTint(POWERUPS[randomType].COLOR);
    
    // 添加闪烁效果
    scene.tweens.add({
        targets: powerup,
        alpha: 0.5,
        duration: 500,
        yoyo: true,
        repeat: -1
    });
    
    // 添加上下浮动效果
    scene.tweens.add({
        targets: powerup,
        y: y - 20,
        duration: 1500,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
    });
    
    // 添加旋转效果
    scene.tweens.add({
        targets: powerup,
        angle: 360,
        duration: 3000,
        repeat: -1
    });
    
    // 设置道具生命周期
    scene.time.delayedCall(30000, () => {
        if (powerup.active) {
            // 消失前的动画
            scene.tweens.add({
                targets: powerup,
                alpha: 0,
                scale: 2,
                duration: 500,
                onComplete: () => {
                    powerup.destroy();
                }
            });
        }
    });
} 