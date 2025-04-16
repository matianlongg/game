/**
 * 刺猬索尼克游戏配置文件
 * 此文件包含游戏中所有可配置的参数和设置
 */

// 游戏基础配置
const GAME_CONFIG = {
    // 游戏引擎类型
    type: Phaser.AUTO,
    // 游戏画布宽度
    width: 800,
    // 游戏画布高度
    height: 600,
    // 物理引擎配置
    physics: {
        // 使用arcade物理引擎
        default: 'arcade',
        arcade: {
            // 重力大小 (Y轴方向)
            gravity: { y: 500 },
            // 是否显示物理引擎调试信息
            debug: true
        }
    }
};

// 游戏世界配置
const WORLD = {
    // 游戏世界宽度 (屏幕宽度的4倍)
    WIDTH: 6200,
    // 游戏世界高度
    HEIGHT: 600
};

// 玩家角色配置
const PLAYER = {
    // 角色移动速度
    MOVE_SPEED: 250,
    // 角色空中移动速度
    AIR_MOVE_SPEED: 200,
    // 角色移动加速度
    ACCELERATION: 20,
    // 角色移动减速度
    DECELERATION: 15,
    // 角色跳跃力度
    JUMP_FORCE: 400,
    // 二段跳力度
    DOUBLE_JUMP_FORCE: 350,
    // 跳跃后的弹跳值
    BOUNCE: 0.1
};

// 跳跃系统配置
const JUMP = {
    // 小悬崖宽容时间（毫秒）
    COYOTE_TIME: 100,
    // 跳跃缓冲时间（毫秒）
    BUFFER_TIME: 150
};

// 冲刺系统配置
const DASH = {
    // 冲刺持续时间（毫秒）
    DURATION: 300,
    // 冲刺冷却时间（毫秒）
    COOLDOWN: 1000,
    // 冲刺速度
    SPEED: 500,
    // 双击检测阈值（毫秒）
    DOUBLE_TAP_THRESHOLD: 300
};

// 战斗系统配置
const COMBAT = {
    // 受伤后无敌时间（毫秒）
    INVINCIBILITY_TIME: 1000,
    // 击退力度
    KNOCKBACK_FORCE: 200
};

// 敌人配置
const ENEMIES = {
    // 敌人移动速度范围
    MOVE_SPEED_MIN: 50,
    MOVE_SPEED_MAX: 100,
    // 敌人旋转动画持续时间
    ROTATION_DURATION: 1500,
    // 敌人生成几率 (0-1之间，越高越不容易生成)
    SPAWN_THRESHOLD: 0.1,
    // 子弹配置
    BULLETS: {
        // 发射间隔（毫秒）
        FIRE_INTERVAL: 2000,
        // 子弹速度
        SPEED: 130,
        // 子弹生命周期（毫秒）
        LIFETIME: 4000,
        // 子弹扩散角度（度）
        SPREAD_ANGLE: 45,
        // 子弹数量（每次发射）
        COUNT: 8,
        // 拥有子弹能力的敌人比例
        SHOOTER_RATIO: 0.8,
        // 最大检测距离（超过此距离不发射）
        MAX_DETECT_DISTANCE: 800
    },
    // 飞行敌人配置
    FLYING: {
        // 移动速度范围
        MOVE_SPEED_MIN: 70,
        MOVE_SPEED_MAX: 120,
        // 飞行高度振幅
        AMPLITUDE: 100,
        // 飞行周期（毫秒）
        PERIOD: 2000,
        // 生成几率
        SPAWN_CHANCE: 0.4
    }
};

// 金币配置
const COINS = {
    TOTAL_COUNT: 32,            // 初始金币总数
    RESPAWN_COUNT: 16,          // 金币全部收集后重新生成的数量
    MIN_HEIGHT: 50,             // 金币最低生成高度
    MAX_HEIGHT: 400,            // 金币最高生成高度
    FLOAT_HEIGHT_MIN: 10,       // 金币最小浮动高度
    FLOAT_HEIGHT_MAX: 30,       // 金币最大浮动高度
    FLOAT_DURATION_MIN: 800,    // 金币最短浮动周期
    FLOAT_DURATION_MAX: 1500    // 金币最长浮动周期
};

// 得分系统配置
const SCORE = {
    // 每帧基础得分
    BASE_SCORE: 1,
    // 击败敌人得分
    ENEMY_SCORE: 100,
    // 冲刺击败敌人得分
    DASH_ENEMY_SCORE: 200,
    // 金币得分
    COIN_SCORE: 50,
    // 飞行敌人得分
    FLYING_ENEMY_SCORE: 150
}; 