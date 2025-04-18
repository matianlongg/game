/**
 * 方块吞球游戏配置文件
 * 此文件包含游戏中所有可配置的参数和设置
 */

// 游戏基础配置
const GAME_CONFIG = {
    // 游戏引擎类型
    type: Phaser.AUTO,
    // 游戏画布默认宽度（实际宽度将由游戏模式决定）
    width: 800,
    // 游戏画布默认高度（实际高度将由游戏模式决定）
    height: 600,
    // 物理引擎配置
    physics: {
        // 使用arcade物理引擎
        default: 'arcade',
        arcade: {
            // 不使用重力
            gravity: { y: 0 },
            // 是否显示物理引擎调试信息（开发时可设为true）
            debug: false
        }
    }
};

// 球配置
const BALL = {
    // 初始球的数量
    INITIAL_COUNT: 20,
    // 球的最小尺寸
    MIN_SIZE: 10,
    // 球的最大尺寸
    MAX_SIZE: 30,
    // 球的最小速度
    MIN_SPEED: 50,
    // 球的最大速度
    MAX_SPEED: 150,
    // 新球产生时的最小速度
    NEW_MIN_SPEED: 70,
    // 新球产生时的最大速度
    NEW_MAX_SPEED: 200,
    // 球的颜色（可选多种颜色）
    COLORS: [
        0x00FF00,   // 绿色
        0x0000FF,   // 蓝色
        0xFFFF00,   // 黄色
        0x00FFFF,   // 青色
        0xFF00FF,   // 紫色
        0xFFA500    // 橙色
    ],
    // 球的最大数量，超过此数量游戏结束（躲避模式用）
    MAX_COUNT: 80,
    // 竞争模式下，场上保持的最小球数
    MIN_COMPETE_COUNT: 15,
    // 球重生间隔（毫秒，竞争模式用）
    RESPAWN_INTERVAL: 2000,
    // 新球生成的位置类型
    SPAWN_TYPE: {
        // 在原球附近生成新球
        NEAR_ORIGINAL: 'near_original',
        // 在随机位置生成新球
        RANDOM: 'random'
    },
    // 默认的生成位置类型
    DEFAULT_SPAWN_TYPE: 'random',
    // 原球附近生成时的偏移范围
    NEAR_OFFSET_RANGE: 80
};

// 窗口配置
const WINDOW = {
    // 可视窗口宽度（浏览器中玩家看到的游戏区域宽度）
    WIDTH: 800,
    // 可视窗口高度（浏览器中玩家看到的游戏区域高度）
    HEIGHT: 600
};

// 游戏模式
const GAME_MODES = {
    // 躲避模式 - 躲避小球，不让球超过上限
    DODGE: {
        id: 'dodge',
        name: '躲避模式',
        description: '躲避小球，时间结束前不让球数量超过上限即为胜利',
        // 躲避模式的画布大小（大于窗口大小，允许有额外空间生成球）
        canvas: {
            width: 800,
            height: 600
        },
        // 躲避模式下球的生成方式
        ballSpawnType: BALL.SPAWN_TYPE.NEAR_ORIGINAL
    },
    // 竞争模式 - 与敌方方块竞争吃球
    COMPETE: {
        id: 'compete',
        name: '竞争模式',
        description: '与敌方方块竞争吃球，变大并吞噬敌方。当你足够大时获胜',
        // 竞争模式的画布大小（更大的区域，使游戏更具挑战性）
        canvas: {
            width: 1600,
            height: 1200
        },
        // 竞争模式下球的生成方式
        ballSpawnType: BALL.SPAWN_TYPE.RANDOM
    }
};

// 相机配置
const CAMERA = {
    // 相机跟随玩家的延迟系数（值越大，相机跟随越平滑）
    LERP: 0.1,
    // 相机边界偏移量（防止相机完全贴边）
    BOUNDS_OFFSET: 50
};

// 方块配置
const SQUARE = {
    // 方块尺寸
    SIZE: 50,
    // 方块颜色（红色）
    COLOR: 0xFF0000,
    // 方块移动速度
    MOVE_SPEED: 300,
    // 方块最大尺寸（竞争模式用）
    MAX_SIZE: 200,
    // 方块尺寸随分数增长系数
    SIZE_GROWTH_FACTOR: 0.1,
    // 获胜所需尺寸（竞争模式用）
    WIN_SIZE: 150
};

// 敌方方块配置
const ENEMY_SQUARES = {
    // 敌方方块数量
    COUNT: 3,
    // 敌方方块颜色
    COLORS: [
        0x8800FF,   // 紫色
        0x0088FF,   // 蓝色
        0xFF8800    // 橙色
    ],
    // 敌方方块最小尺寸
    MIN_SIZE: 30,
    // 敌方方块最大尺寸
    MAX_SIZE: 60,
    // 敌方方块最小速度
    MIN_SPEED: 70,
    // 敌方方块最大速度
    MAX_SPEED: 120,
    // 敌方方块AI反应时间（毫秒）
    AI_UPDATE_INTERVAL: 500,
    // 敌方方块感知范围
    PERCEPTION_RADIUS: 200,
    // 敌方方块尺寸随分数增长系数
    SIZE_GROWTH_FACTOR: 0.08
};



// 分数配置
const SCORE = {
    // 吃掉一个球的基础分数
    BASE_POINTS: 10,
    // 根据球的大小额外加分的系数
    SIZE_MULTIPLIER: 0.5,
    // 吃掉敌方方块的奖励分数
    ENEMY_POINTS: 100
};

// 游戏配置
const GAME = {
    // 游戏持续时间（秒）
    DURATION: 9999,
    // 游戏难度随时间增加的系数
    DIFFICULTY_FACTOR: 0.05
}; 