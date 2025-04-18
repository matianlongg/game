// 游戏核心配置，使用config.js中的设置
const config = {
    type: GAME_CONFIG.type,
    width: WINDOW.WIDTH,  // 使用窗口宽度作为默认显示宽度
    height: WINDOW.HEIGHT, // 使用窗口高度作为默认显示高度
    physics: GAME_CONFIG.physics,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// 创建游戏实例
const game = new Phaser.Game(config);

// 游戏变量
let player; // 玩家控制的方块
let balls; // 球的组
let cursors; // 键盘输入
let score = 0; // 分数
let scoreText; // 分数文本
let timeLeft = GAME.DURATION; // 剩余时间
let timeText; // 时间文本
let gameOver = false; // 游戏是否结束
let gameOverText; // 游戏结束文本
let restartButton; // 重新开始按钮
let gameStarted = false; // 游戏是否已开始
let startText; // 开始游戏文本
let ballCountText; // 球数量文本
let enemySquares; // 敌方方块组（竞争模式）
let currentGameMode; // 当前游戏模式
let modeSelectionGroup; // 模式选择界面组
let playerSizeText; // 玩家尺寸文本（竞争模式）
let ballSpawnTimer; // 球生成计时器（竞争模式）
let mainCamera; // 主相机
let canvasWidth; // 当前画布宽度
let canvasHeight; // 当前画布高度
let uiLayer; // UI图层，用于固定UI元素在屏幕上
let currentBallSpawnType; // 添加当前的球生成类型全局变量

/**
 * 预加载游戏资源
 */
function preload() {
    // 在这里我们使用生成的图形，无需加载外部资源
}

/**
 * 创建游戏场景和对象
 */
function create() {
    // 创建UI图层 - 首先初始化UI图层
    uiLayer = this.add.container(0, 0);
    uiLayer.setDepth(100); // 设置较高的深度值，确保UI显示在游戏元素之上
    
    // 创建主相机
    mainCamera = this.cameras.main;
    
    // 创建玩家控制的方块 - 暂时隐藏，等选择模式后再显示
    player = this.add.rectangle(
        WINDOW.WIDTH / 2, 
        WINDOW.HEIGHT / 2, 
        SQUARE.SIZE, 
        SQUARE.SIZE, 
        SQUARE.COLOR
    ).setVisible(false);
    
    // 启用物理效果
    this.physics.add.existing(player);
    player.body.setCollideWorldBounds(true);
    player.body.setFriction(0, 0);
    player.body.setSize(SQUARE.SIZE, SQUARE.SIZE);
    
    // 创建球的组
    balls = this.physics.add.group();
    
    // 创建敌方方块组（竞争模式）
    enemySquares = this.physics.add.group();
    
    // 初始化UI元素
    initializeUIElements(this, uiLayer);
    
    // 创建键盘输入
    cursors = this.input.keyboard.createCursorKeys();
    
    // 创建模式选择界面
    createModeSelectionUI(this);
}

/**
 * 初始化UI元素
 */
function initializeUIElements(scene, uiLayer) {
    // 初始化分数显示
    scoreText = scene.add.text(16, 16, '分数: 0', { 
        fontSize: '24px', 
        fill: '#FFF',
        fontFamily: 'Arial'
    }).setVisible(false).setScrollFactor(0);
    uiLayer.add(scoreText);
    
    // 初始化时间显示
    timeText = scene.add.text(WINDOW.WIDTH - 150, 16, '时间: ' + timeLeft, { 
        fontSize: '24px', 
        fill: '#FFF',
        fontFamily: 'Arial'
    }).setVisible(false).setScrollFactor(0);
    uiLayer.add(timeText);
    
    // 初始化球数量显示（躲避模式用）
    ballCountText = scene.add.text(WINDOW.WIDTH / 2, 16, '球数量: 0/' + BALL.MAX_COUNT, { 
        fontSize: '24px', 
        fill: '#FFF',
        fontFamily: 'Arial'
    }).setOrigin(0.5, 0).setVisible(false).setScrollFactor(0);
    uiLayer.add(ballCountText);
    
    // 初始化玩家尺寸显示（竞争模式用）
    playerSizeText = scene.add.text(WINDOW.WIDTH / 2, 16, '方块大小: ' + SQUARE.SIZE, { 
        fontSize: '24px', 
        fill: '#FFF',
        fontFamily: 'Arial'
    }).setOrigin(0.5, 0).setVisible(false).setScrollFactor(0);
    uiLayer.add(playerSizeText);
    
    // 预先准备游戏结束文本（默认隐藏）
    gameOverText = scene.add.text(
        WINDOW.WIDTH / 2, 
        WINDOW.HEIGHT / 2 - 50, 
        '游戏结束!', 
        { 
            fontSize: '48px', 
            fill: '#FF0000',
            fontFamily: 'Arial'
        }
    ).setOrigin(0.5).setVisible(false).setScrollFactor(0);
    uiLayer.add(gameOverText);
    
    // 预先准备重新开始按钮（默认隐藏）
    restartButton = scene.add.text(
        WINDOW.WIDTH / 2, 
        WINDOW.HEIGHT / 2 + 50, 
        '再来一局', 
        { 
            fontSize: '32px', 
            fill: '#00FF00',
            fontFamily: 'Arial',
            backgroundColor: '#333',
            padding: { left: 15, right: 15, top: 10, bottom: 10 }
        }
    ).setOrigin(0.5)
     .setInteractive({ useHandCursor: true })
     .on('pointerdown', restartGame)
     .setVisible(false)
     .setScrollFactor(0);
    uiLayer.add(restartButton);
}

/**
 * 创建模式选择界面
 */
function createModeSelectionUI(scene) {
    // 创建模式选择组
    modeSelectionGroup = scene.add.group();
    
    // 创建标题
    const title = scene.add.text(
        WINDOW.WIDTH / 2,
        100,
        '选择游戏模式',
        {
            fontSize: '48px',
            fill: '#FFF',
            fontFamily: 'Arial'
        }
    ).setOrigin(0.5);
    
    modeSelectionGroup.add(title);
    
    // 创建躲避模式按钮
    const dodgeButton = scene.add.text(
        WINDOW.WIDTH / 2,
        250,
        GAME_MODES.DODGE.name,
        {
            fontSize: '32px',
            fill: '#FFF',
            fontFamily: 'Arial',
            backgroundColor: '#009900',
            padding: { left: 20, right: 20, top: 10, bottom: 10 }
        }
    ).setOrigin(0.5)
     .setInteractive({ useHandCursor: true })
     .on('pointerdown', () => selectGameMode(scene, GAME_MODES.DODGE.id, uiLayer));
    
    // 添加模式描述
    const dodgeDesc = scene.add.text(
        WINDOW.WIDTH / 2,
        300,
        GAME_MODES.DODGE.description,
        {
            fontSize: '18px',
            fill: '#CCC',
            fontFamily: 'Arial'
        }
    ).setOrigin(0.5);
    
    modeSelectionGroup.add(dodgeButton);
    modeSelectionGroup.add(dodgeDesc);
    
    // 创建竞争模式按钮
    const competeButton = scene.add.text(
        WINDOW.WIDTH / 2,
        400,
        GAME_MODES.COMPETE.name,
        {
            fontSize: '32px',
            fill: '#FFF',
            fontFamily: 'Arial',
            backgroundColor: '#990000',
            padding: { left: 20, right: 20, top: 10, bottom: 10 }
        }
    ).setOrigin(0.5)
     .setInteractive({ useHandCursor: true })
     .on('pointerdown', () => selectGameMode(scene, GAME_MODES.COMPETE.id, uiLayer));
    
    // 添加模式描述
    const competeDesc = scene.add.text(
        WINDOW.WIDTH / 2,
        450,
        GAME_MODES.COMPETE.description,
        {
            fontSize: '18px',
            fill: '#CCC',
            fontFamily: 'Arial'
        }
    ).setOrigin(0.5);
    
    modeSelectionGroup.add(competeButton);
    modeSelectionGroup.add(competeDesc);
}

/**
 * 选择游戏模式
 */
function selectGameMode(scene, modeId, uiLayer) {
    // 设置当前游戏模式
    currentGameMode = modeId;
    
    // 隐藏模式选择界面
    modeSelectionGroup.setVisible(false);
    
    // 根据游戏模式设置世界边界和相机
    if (currentGameMode === GAME_MODES.DODGE.id) {
        // 躲避模式 - 使用较小的世界大小
        canvasWidth = GAME_MODES.DODGE.canvas.width;
        canvasHeight = GAME_MODES.DODGE.canvas.height;
        // 设置球生成类型
        currentBallSpawnType = GAME_MODES.DODGE.ballSpawnType;
    } else if (currentGameMode === GAME_MODES.COMPETE.id) {
        // 竞争模式 - 使用较大的世界大小
        canvasWidth = GAME_MODES.COMPETE.canvas.width;
        canvasHeight = GAME_MODES.COMPETE.canvas.height;
        // 设置球生成类型
        currentBallSpawnType = GAME_MODES.COMPETE.ballSpawnType;
    }
    
    // 设置物理世界边界
    scene.physics.world.setBounds(0, 0, canvasWidth, canvasHeight);
    
    // 设置主相机边界
    mainCamera = scene.cameras.main;
    mainCamera.setBounds(0, 0, canvasWidth, canvasHeight);
    
    // 显示玩家方块
    player.setVisible(true);
    
    // 显示分数和时间
    scoreText.setVisible(true);
    timeText.setVisible(true);
    
    // 根据不同模式显示不同UI元素
    if (currentGameMode === GAME_MODES.DODGE.id) {
        // 躲避模式显示球数量
        ballCountText.setVisible(true);
        playerSizeText.setVisible(false);
        
        // 显示开始提示
        startText = scene.add.text(
            WINDOW.WIDTH / 2, 
            WINDOW.HEIGHT / 2, 
            '按空格键开始躲避模式', 
            { 
                fontSize: '32px', 
                fill: '#FFF',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5).setScrollFactor(0);
        uiLayer.add(startText);
    } else if (currentGameMode === GAME_MODES.COMPETE.id) {
        // 竞争模式显示玩家尺寸
        playerSizeText.setVisible(true);
        ballCountText.setVisible(false);
        
        // 显示开始提示
        startText = scene.add.text(
            WINDOW.WIDTH / 2, 
            WINDOW.HEIGHT / 2, 
            '按空格键开始竞争模式', 
            { 
                fontSize: '32px', 
                fill: '#FFF',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5).setScrollFactor(0);
        uiLayer.add(startText);
    }
    
    // 绑定空格键开始游戏
    scene.input.keyboard.on('keydown-SPACE', function() {
        if (!gameStarted && !gameOver) {
            startGame(scene);
        }
    });
}

/**
 * 游戏循环更新
 */
function update() {
    if (gameOver) return;
    
    if (!gameStarted) return;
    
    // 处理玩家输入
    handlePlayerInput(this);
    
    // 相机跟随玩家
    updateCamera(this);
    
    // 根据不同模式进行不同的更新逻辑
    if (currentGameMode === GAME_MODES.DODGE.id) {
        // 躲避模式 - 更新球的数量显示和检查球数量上限
        updateBallCount(this);
        checkBallLimit(this);
    } else if (currentGameMode === GAME_MODES.COMPETE.id) {
        // 竞争模式 - 更新玩家尺寸显示，处理玩家与敌方方块的碰撞
        updatePlayerSize(this);
        checkWinCondition(this);
    }
}

/**
 * 更新相机位置，使其跟随玩家
 */
function updateCamera(scene) {
    // 使用线性插值让相机平滑跟随玩家
    mainCamera.startFollow(player, true, CAMERA.LERP, CAMERA.LERP);
}

/**
 * 处理玩家输入控制方块移动
 */
function handlePlayerInput(scene) {
    // 重置速度
    player.body.setVelocity(0);
    
    // 根据按键移动方块
    if (cursors.left.isDown) {
        player.body.setVelocityX(-SQUARE.MOVE_SPEED);
    } else if (cursors.right.isDown) {
        player.body.setVelocityX(SQUARE.MOVE_SPEED);
    }
    
    if (cursors.up.isDown) {
        player.body.setVelocityY(-SQUARE.MOVE_SPEED);
    } else if (cursors.down.isDown) {
        player.body.setVelocityY(SQUARE.MOVE_SPEED);
    }
}

/**
 * 开始游戏
 */
function startGame(scene) {
    gameStarted = true;
    
    // 根据不同模式设置分数初始值
    if (currentGameMode === GAME_MODES.DODGE.id) {
        // 躲避模式分数从0开始
        score = 0;
    } else if (currentGameMode === GAME_MODES.COMPETE.id) {
        // 竞争模式分数从0开始
        score = 0;
    }
    
    scoreText.setText('分数: ' + score);
    
    if (startText) {
        startText.destroy();
    }
    
    // 根据不同模式设置不同的游戏初始状态
    if (currentGameMode === GAME_MODES.DODGE.id) {
        // 躲避模式 - 创建初始的球
        for (let i = 0; i < BALL.INITIAL_COUNT; i++) {
            createBall(scene);
        }
        
        // 设置球和方块之间的碰撞
        scene.physics.add.overlap(player, balls, eatBall, null, scene);
        
        // 设置球与球之间的碰撞
        scene.physics.add.collider(balls, balls);
    } else if (currentGameMode === GAME_MODES.COMPETE.id) {
        // 竞争模式 - 创建初始的球
        for (let i = 0; i < BALL.INITIAL_COUNT; i++) {
            createBall(scene);
        }
        
        // 创建敌方方块
        for (let i = 0; i < ENEMY_SQUARES.COUNT; i++) {
            createEnemySquare(scene, i);
        }
        
        // 设置球与玩家之间的碰撞
        scene.physics.add.overlap(player, balls, eatBallCompete, null, scene);
        
        // 设置球与敌方方块之间的碰撞
        scene.physics.add.overlap(enemySquares, balls, enemyEatBall, null, scene);
        
        // 设置玩家与敌方方块之间的碰撞
        scene.physics.add.overlap(player, enemySquares, playerEnemyCollision, null, scene);
        
        // 设置球与球之间的碰撞
        scene.physics.add.collider(balls, balls);
        
        // 设置敌方方块之间的碰撞
        scene.physics.add.collider(enemySquares, enemySquares);
        
        // 设置球的定期生成定时器
        ballSpawnTimer = scene.time.addEvent({
            delay: BALL.RESPAWN_INTERVAL,
            callback: function() {
                // 如果场上球的数量少于最小数量，则生成新球
                if (balls.getChildren().length < BALL.MIN_COMPETE_COUNT) {
                    createBall(scene);
                }
            },
            callbackScope: scene,
            loop: true
        });
        
        // 设置敌方方块AI更新定时器
        scene.time.addEvent({
            delay: ENEMY_SQUARES.AI_UPDATE_INTERVAL,
            callback: updateEnemyAI,
            callbackScope: scene,
            loop: true
        });
    }
    
    // 设置计时器
    scene.time.addEvent({
        delay: 1000, // 1秒
        callback: updateTimer,
        callbackScope: scene,
        loop: true
    });
}

/**
 * 创建敌方方块
 */
function createEnemySquare(scene, index) {
    // 随机位置，避免与玩家重叠
    let x, y;
    do {
        x = Phaser.Math.Between(50, canvasWidth - 50);
        y = Phaser.Math.Between(50, canvasHeight - 50);
    } while (Phaser.Math.Distance.Between(x, y, player.x, player.y) < 200);
    
    // 随机大小
    const size = Phaser.Math.Between(ENEMY_SQUARES.MIN_SIZE, ENEMY_SQUARES.MAX_SIZE);
    
    // 随机颜色
    const colorIndex = index % ENEMY_SQUARES.COLORS.length;
    const color = ENEMY_SQUARES.COLORS[colorIndex];
    
    // 创建敌方方块
    const enemySquare = scene.add.rectangle(x, y, size, size, color);
    
    // 将敌方方块加入物理组
    enemySquares.add(enemySquare);
    
    // 设置物理属性
    enemySquare.body.setCollideWorldBounds(true);
    enemySquare.body.setFriction(0, 0);
    
    // 存储敌方方块的属性
    enemySquare.score = 0;
    enemySquare.size = size;
    enemySquare.originalColor = color;
    
    // 随机初始速度
    const speed = Phaser.Math.FloatBetween(ENEMY_SQUARES.MIN_SPEED, ENEMY_SQUARES.MAX_SPEED);
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    
    enemySquare.body.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
    );
    
    return enemySquare;
}

/**
 * 更新敌方方块AI
 */
function updateEnemyAI() {
    if (!gameStarted || gameOver) return;
    
    const enemies = enemySquares.getChildren();
    const allBalls = balls.getChildren();
    
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        
        // 寻找最近的球或比自己小的玩家
        let closestTarget = null;
        let closestDistance = ENEMY_SQUARES.PERCEPTION_RADIUS;
        
        // 检查附近的球
        for (let j = 0; j < allBalls.length; j++) {
            const ball = allBalls[j];
            const distance = Phaser.Math.Distance.Between(
                enemy.x, enemy.y, ball.x, ball.y
            );
            
            if (distance < closestDistance) {
                closestTarget = ball;
                closestDistance = distance;
            }
        }
        
        // 检查玩家是否比自己小且在感知范围内
        const distanceToPlayer = Phaser.Math.Distance.Between(
            enemy.x, enemy.y, player.x, player.y
        );
        
        if (distanceToPlayer < closestDistance && enemy.size > SQUARE.SIZE) {
            closestTarget = player;
            closestDistance = distanceToPlayer;
        }
        
        // 如果有目标，向目标移动
        if (closestTarget) {
            // 计算方向向量
            const dx = closestTarget.x - enemy.x;
            const dy = closestTarget.y - enemy.y;
            
            // 向量归一化
            const length = Math.sqrt(dx * dx + dy * dy);
            const dirX = dx / length;
            const dirY = dy / length;
            
            // 根据敌方大小调整速度
            const speed = Phaser.Math.Linear(
                ENEMY_SQUARES.MAX_SPEED, 
                ENEMY_SQUARES.MIN_SPEED, 
                enemy.size / SQUARE.MAX_SIZE
            );
            
            // 设置速度，追逐目标
            enemy.body.setVelocity(
                dirX * speed,
                dirY * speed
            );
        } else {
            // 如果没有目标，随机移动
            if (Phaser.Math.Between(0, 10) === 0) { // 10%的几率改变方向
                const speed = Phaser.Math.FloatBetween(ENEMY_SQUARES.MIN_SPEED, ENEMY_SQUARES.MAX_SPEED);
                const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                
                enemy.body.setVelocity(
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed
                );
            }
        }
    }
}

/**
 * 玩家与敌方方块碰撞处理
 */
function playerEnemyCollision(player, enemy) {
    // 比较大小
    if (SQUARE.SIZE > enemy.size) {
        // 玩家更大，吃掉敌方方块
        const enemyPoints = SCORE.ENEMY_POINTS + Math.floor(enemy.size);
        score += enemyPoints;
        scoreText.setText('分数: ' + score);
        
        // 显示得分动画
        showPointsAnimation(this, enemy.x, enemy.y, enemyPoints);
        
        // 增加玩家大小
        updatePlayerSizeFromScore();
        
        // 销毁敌方方块
        enemy.destroy();
    } else if (SQUARE.SIZE < enemy.size) {
        // 敌方更大，玩家被吃
        endGame(this, '你被敌方方块吃掉了!');
    }
    // 如果大小相同，则互相弹开，不做特殊处理
}

/**
 * 敌方方块吃球的处理
 */
function enemyEatBall(enemy, ball) {
    // 获取当前场景
    const scene = enemy.scene;
    
    // 增加敌方方块的分数
    enemy.score += SCORE.BASE_POINTS + Math.floor(ball.originalSize * SCORE.SIZE_MULTIPLIER);
    
    // 更新敌方方块大小
    const newSize = Math.min(
        ENEMY_SQUARES.MIN_SIZE + enemy.score * ENEMY_SQUARES.SIZE_GROWTH_FACTOR,
        SQUARE.MAX_SIZE
    );
    
    // 调整敌方方块物理体大小
    enemy.setSize(newSize, newSize);
    enemy.body.setSize(newSize, newSize);
    enemy.size = newSize;
    
    // 获取球被吃前的位置和大小
    const ballX = ball.x;
    const ballY = ball.y;
    const ballSize = ball.originalSize * 0.7;
    
    // 销毁被吃的球
    ball.destroy();
    
    // 产生两个新球
    const newBallSize = Math.max(ballSize, BALL.MIN_SIZE / 2);
    
    // 根据配置选择球生成的位置
    for (let i = 0; i < 2; i++) {
        let newX, newY;
        
        if (currentBallSpawnType === BALL.SPAWN_TYPE.NEAR_ORIGINAL) {
            // 在原球附近生成新球
            const offsetX = Phaser.Math.Between(-BALL.NEAR_OFFSET_RANGE, BALL.NEAR_OFFSET_RANGE);
            const offsetY = Phaser.Math.Between(-BALL.NEAR_OFFSET_RANGE, BALL.NEAR_OFFSET_RANGE);
            
            // 确保新球不会生成在屏幕边缘外
            newX = Phaser.Math.Clamp(
                ballX + offsetX, 
                newBallSize, 
                canvasWidth - newBallSize
            );
            
            newY = Phaser.Math.Clamp(
                ballY + offsetY, 
                newBallSize, 
                canvasHeight - newBallSize
            );
        } else {
            // 在随机位置生成新球
            newX = Phaser.Math.Between(newBallSize, canvasWidth - newBallSize);
            newY = Phaser.Math.Between(newBallSize, canvasHeight - newBallSize);
        }
        
        createBall(
            scene, 
            newX,
            newY,
            newBallSize
        );
    }
}

/**
 * 竞争模式下玩家吃球处理
 */
function eatBallCompete(player, ball) {
    // 计算得分（基础分 + 球大小加成）
    const ballPoints = Math.floor(SCORE.BASE_POINTS + ball.originalSize * SCORE.SIZE_MULTIPLIER);
    score += ballPoints;
    scoreText.setText('分数: ' + score);
    
    // 获取球被吃前的位置和大小
    const ballX = ball.x;
    const ballY = ball.y;
    const ballSize = ball.originalSize * 0.7;
    
    // 更新玩家大小
    updatePlayerSizeFromScore();
    
    // 显示得分动画
    showPointsAnimation(this, ball.x, ball.y, ballPoints);
    
    // 销毁被吃的球
    ball.destroy();
    
    // 产生两个新球
    const newBallSize = Math.max(ballSize, BALL.MIN_SIZE / 2);
    
    // 根据配置选择球生成的位置
    for (let i = 0; i < 2; i++) {
        let newX, newY;
        
        if (currentBallSpawnType === BALL.SPAWN_TYPE.NEAR_ORIGINAL) {
            // 在原球附近生成新球
            const offsetX = Phaser.Math.Between(-BALL.NEAR_OFFSET_RANGE, BALL.NEAR_OFFSET_RANGE);
            const offsetY = Phaser.Math.Between(-BALL.NEAR_OFFSET_RANGE, BALL.NEAR_OFFSET_RANGE);
            
            // 确保新球不会生成在屏幕边缘外
            newX = Phaser.Math.Clamp(
                ballX + offsetX, 
                newBallSize, 
                canvasWidth - newBallSize
            );
            
            newY = Phaser.Math.Clamp(
                ballY + offsetY, 
                newBallSize, 
                canvasHeight - newBallSize
            );
        } else {
            // 在随机位置生成新球
            newX = Phaser.Math.Between(newBallSize, canvasWidth - newBallSize);
            newY = Phaser.Math.Between(newBallSize, canvasHeight - newBallSize);
        }
        
        createBall(
            this, 
            newX,
            newY,
            newBallSize
        );
    }
}

/**
 * 更新玩家大小
 */
function updatePlayerSizeFromScore() {
    // 根据分数计算新的尺寸
    const newSize = Math.min(
        SQUARE.SIZE + score * SQUARE.SIZE_GROWTH_FACTOR,
        SQUARE.MAX_SIZE
    );
    
    // 调整玩家方块的物理体大小
    player.setSize(newSize, newSize);
    player.body.setSize(newSize, newSize);
    SQUARE.SIZE = newSize;
}

/**
 * 更新玩家尺寸显示（竞争模式用）
 */
function updatePlayerSize(scene) {
    playerSizeText.setText('方块大小: ' + Math.floor(SQUARE.SIZE));
    
    // 如果接近胜利条件，改变文字颜色
    if (SQUARE.SIZE > SQUARE.WIN_SIZE * 0.8) {
        playerSizeText.setStyle({ fontSize: '24px', fill: '#FFFF00', fontFamily: 'Arial' });
    } else {
        playerSizeText.setStyle({ fontSize: '24px', fill: '#FFF', fontFamily: 'Arial' });
    }
}

/**
 * 检查胜利条件（竞争模式用）
 */
function checkWinCondition(scene) {
    if (SQUARE.SIZE >= SQUARE.WIN_SIZE) {
        endGame(scene, '恭喜你胜利了!\n你的方块足够大了!');
    }
}

/**
 * 显示得分动画
 */
function showPointsAnimation(scene, x, y, points) {
    // 显示得分动画，确保它在世界坐标系而不是屏幕坐标系
    const pointsText = scene.add.text(x, y, '+' + points, {
        fontSize: '20px',
        fill: '#FFFFFF'
    }).setOrigin(0.5);
    
    // 得分文字上浮消失的动画
    scene.tweens.add({
        targets: pointsText,
        y: y - 50,
        alpha: 0,
        duration: 1000,
        onComplete: function() {
            pointsText.destroy();
        }
    });
}

/**
 * 创建一个新球
 */
function createBall(scene, x, y, size) {
    // 如果没有指定位置，则随机生成
    const ballX = x || Phaser.Math.Between(50, canvasWidth - 50);
    const ballY = y || Phaser.Math.Between(50, canvasHeight - 50);
    
    // 如果没有指定大小，则随机生成
    const ballSize = size || Phaser.Math.Between(BALL.MIN_SIZE, BALL.MAX_SIZE);
    
    // 随机选择一个颜色
    const colorIndex = Phaser.Math.Between(0, BALL.COLORS.length - 1);
    const ballColor = BALL.COLORS[colorIndex];
    
    // 创建球图形
    const ball = scene.add.circle(ballX, ballY, ballSize / 2, ballColor);
    
    // 将球加入物理组
    balls.add(ball);
    
    // 设置球的物理属性
    ball.body.setCircle(ballSize / 2);
    ball.body.setBounce(1, 1);
    ball.body.setCollideWorldBounds(true);
    
    // 增加球的物理特性，使其更加逼真
    ball.body.setFriction(0, 0); // 减少摩擦力
    ball.body.setDamping(false); // 关闭阻尼效果
    
    // 随机设置球的初始速度和方向
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    let speed;
    
    // 如果是新产生的球（被吃后产生），则使用较快的速度
    if (x !== undefined && y !== undefined) {
        speed = Phaser.Math.FloatBetween(BALL.NEW_MIN_SPEED, BALL.NEW_MAX_SPEED);
    } else {
        speed = Phaser.Math.FloatBetween(BALL.MIN_SPEED, BALL.MAX_SPEED);
    }
    
    ball.body.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
    );
    
    // 存储球的原始大小，用于计算分数
    ball.originalSize = ballSize;
    
    return ball;
}

/**
 * 躲避模式中方块吃球的处理
 */
function eatBall(player, ball) {
    // 躲避模式下不计算吃球分数，分数由坚持时间和球数量决定
    
    // 获取球被吃前的位置和大小
    const ballX = ball.x;
    const ballY = ball.y;
    const ballSize = ball.originalSize * 0.7; // 新球略小一些
    
    // 销毁被吃的球
    ball.destroy();
    
    // 产生两个新球 - 确保总是生成两个新球
    const newBallSize = Math.max(ballSize, BALL.MIN_SIZE / 2);
    
    // 根据配置选择球生成的位置
    for (let i = 0; i < 2; i++) {
        let newX, newY;
        
        if (currentBallSpawnType === BALL.SPAWN_TYPE.NEAR_ORIGINAL) {
            // 在原球附近生成新球
            const offsetX = Phaser.Math.Between(-BALL.NEAR_OFFSET_RANGE, BALL.NEAR_OFFSET_RANGE);
            const offsetY = Phaser.Math.Between(-BALL.NEAR_OFFSET_RANGE, BALL.NEAR_OFFSET_RANGE);
            
            // 确保新球不会生成在屏幕边缘外
            newX = Phaser.Math.Clamp(
                ballX + offsetX, 
                newBallSize, 
                canvasWidth - newBallSize
            );
            
            newY = Phaser.Math.Clamp(
                ballY + offsetY, 
                newBallSize, 
                canvasHeight - newBallSize
            );
        } else {
            // 在随机位置生成新球
            newX = Phaser.Math.Between(newBallSize, canvasWidth - newBallSize);
            newY = Phaser.Math.Between(newBallSize, canvasHeight - newBallSize);
        }
        
        createBall(
            this, 
            newX,
            newY,
            newBallSize
        );
    }
}

/**
 * 更新球的数量显示
 */
function updateBallCount(scene) {
    const ballCount = balls.getChildren().length;
    ballCountText.setText('球数量: ' + ballCount + '/' + BALL.MAX_COUNT);
    
    // 如果球的数量接近上限，改变文字颜色提醒玩家
    if (ballCount > BALL.MAX_COUNT * 0.8) {
        ballCountText.setStyle({ fontSize: '24px', fill: '#FF0000', fontFamily: 'Arial' });
    } else {
        ballCountText.setStyle({ fontSize: '24px', fill: '#FFF', fontFamily: 'Arial' });
    }
}

/**
 * 检查球的数量限制
 */
function checkBallLimit(scene) {
    if (balls.getChildren().length >= BALL.MAX_COUNT) {
        // 球数量超过上限，游戏结束
        endGame(scene, '球太多了！\n球数量达到上限 ' + BALL.MAX_COUNT);
    }
}

/**
 * 更新游戏计时器
 */
function updateTimer() {
    if (!gameStarted || gameOver) return;
    
    timeLeft--;
    timeText.setText('时间: ' + timeLeft);
    
    // 躲避模式下，根据当前屏幕上的球数增加分数
    if (currentGameMode === GAME_MODES.DODGE.id) {
        const ballCount = balls.getChildren().length;
        
        // 每秒增加的分数等于当前球的数量
        score += ballCount;
        
        // 更新分数显示
        scoreText.setText('分数: ' + score);
    }
    
    if (timeLeft <= 0) {
        if (currentGameMode === GAME_MODES.DODGE.id) {
            // 躲避模式下，时间结束且球数量未超限，则胜利
            endGame(this, '恭喜你胜利了!\n成功撑到了最后!');
        } else {
            // 竞争模式下，时间结束按照正常规则判断
            endGame(this, '时间结束!\n你没有足够壮大');
        }
    }
}

/**
 * 结束游戏
 */
function endGame(scene, message) {
    gameOver = true;
    
    // 停止所有球的移动
    balls.getChildren().forEach(ball => {
        ball.body.setVelocity(0, 0);
    });
    
    // 停止所有敌方方块的移动（竞争模式）
    if (enemySquares) {
        enemySquares.getChildren().forEach(enemy => {
            enemy.body.setVelocity(0, 0);
        });
    }
    
    // 停止球生成计时器（竞争模式）
    if (ballSpawnTimer) {
        ballSpawnTimer.remove();
    }
    
    // 停止玩家方块的移动
    player.body.setVelocity(0, 0);
    
    // 显示游戏结束文本和重新开始按钮
    const endMessage = message || '游戏结束!';
    gameOverText.setText(endMessage + '\n最终得分: ' + score);
    gameOverText.setVisible(true);
    restartButton.setVisible(true);
}

/**
 * 重新开始游戏
 */
function restartGame() {
    // 获取当前场景
    const currentScene = this.scene || this.scene.scene;
    
    // 重置游戏状态
    gameOver = false;
    gameStarted = false;
    score = 0;
    timeLeft = GAME.DURATION;
    
    // 重置玩家方块大小（竞争模式）
    if (currentGameMode === GAME_MODES.COMPETE.id) {
        SQUARE.SIZE = 50; // 恢复到初始大小
        player.setSize(SQUARE.SIZE, SQUARE.SIZE);
        player.body.setSize(SQUARE.SIZE, SQUARE.SIZE);
        playerSizeText.setText('方块大小: ' + SQUARE.SIZE);
        playerSizeText.setStyle({ fontSize: '24px', fill: '#FFF', fontFamily: 'Arial' });
    }
    
    // 更新显示
    scoreText.setText('分数: 0');
    timeText.setText('时间: ' + timeLeft);
    
    // 隐藏游戏结束相关元素
    gameOverText.setVisible(false);
    restartButton.setVisible(false);
    
    // 清除所有球和敌方方块
    balls.clear(true, true);
    if (enemySquares) {
        enemySquares.clear(true, true);
    }
    
    // 重置玩家位置
    player.x = canvasWidth / 2;
    player.y = canvasHeight / 2;
    
    // 显示开始提示文本
    if (currentGameMode === GAME_MODES.DODGE.id) {
        startText = currentScene.add.text(
            WINDOW.WIDTH / 2, 
            WINDOW.HEIGHT / 2, 
            '按空格键开始躲避模式', 
            { 
                fontSize: '32px', 
                fill: '#FFF',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5).setScrollFactor(0);
        uiLayer.add(startText);
    } else if (currentGameMode === GAME_MODES.COMPETE.id) {
        startText = currentScene.add.text(
            WINDOW.WIDTH / 2, 
            WINDOW.HEIGHT / 2, 
            '按空格键开始竞争模式', 
            { 
                fontSize: '32px', 
                fill: '#FFF',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5).setScrollFactor(0);
        uiLayer.add(startText);
    }
} 