var gameObject = {
	birdSize: {
		width: 100,
		height: 245
	},
	scene: {
		width: 800,
		height: 600,
		backgroundColor: '#71c5cf'
	},
	gravity: {
		y: 250
	},
	platforms: null,
	cursors: null,
	player: null,
	stars: null,
	score: 0,
	scoreText: null,
	bombs: null,
	sounds:{},
	game:{
		gameOver : false,
		stopped :false
	}

};


var config = {
	type: Phaser.AUTO,
	width: gameObject.scene.width,
	height: gameObject.scene.height,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: {
				y: gameObject.gravity.y
			},
			debug: false
		}
	},
	scene: {
		preload: preload,
		create: create,
		update: update
	}
};

var game = new Phaser.Game(config);

function preload() {
	this.load.image('sky', 'assets/sky.png');
	this.load.image('ground', 'assets/platform.png');
	this.load.image('star', 'assets/star.png');
	this.load.image('bomb', 'assets/bomb.png');
	this.load.spritesheet('dude',
		'assets/dude.png',
		{frameWidth: 32, frameHeight: 48}
	);
	this.load.audio('bgm', 'assets/sounds/bgm_01.mp3');
	this.load.audio('pick_up_coin', 'assets/sounds/coin_pick.wav');
	this.load.audio('jump', 'assets/sounds/coin_pick.wav');
	this.load.audio('explosion', 'assets/sounds/explosion_04.mp3');
}

function create() {
	createImage(this);
	createSounds(this);
	createObject(this);
	createColli(this);
	createAnims(this);
	createCursors(this);
}

function update() {
	if(!gameObject.game.stopped){
		if (gameObject.cursors.left.isDown) {
			gameObject.player.setVelocityX(-160);
			gameObject.player.anims.play('left', true);
			if (gameObject.speedUpKey.isDown) {
				gameObject.player.setVelocityX(-360);
			}
		} else if (gameObject.cursors.right.isDown) {
			gameObject.player.setVelocityX(160);
			gameObject.player.anims.play('right', true);
			if (gameObject.speedUpKey.isDown) {
				gameObject.player.setVelocityX(360);
			}
		} else {
			gameObject.player.setVelocityX(0);
			gameObject.player.anims.play('turn');
		}

		if (gameObject.cursors.space.isDown && gameObject.player.body.touching.down) {
			gameObject.player.setVelocityY(-650);
			gameObject.sounds.jump.play();
		}
	}
}

function createSounds(game) {
	//bgm
	gameObject.sounds.bgm = game.sound.add('bgm', {
		loop: true,
		volume : 0.7
	});
	gameObject.sounds.bgm.play();

	//star
	gameObject.sounds.starCollect = game.sound.add('pick_up_coin', {
		volume : 0.7
	});

	//jump
	gameObject.sounds.jump  = game.sound.add('jump', {
		volume : 2
	});

	//explosion
	gameObject.sounds.explosion  = game.sound.add('explosion', {
		volume : 1
	});
}

function createImage(game) {
	game.add.image(400, 300, 'sky');
}

function createAnims(game) {
	game.anims.create({
		key: 'left',
		frames: game.anims.generateFrameNumbers('dude', {start: 0, end: 3}),
		frameRate: 10,
		repeat: -1
	});
	game.anims.create({
		key: 'turn',
		frames: [{key: 'dude', frame: 4}],
		frameRate: 20
	});
	game.anims.create({
		key: 'right',
		frames: game.anims.generateFrameNumbers('dude', {start: 5, end: 8}),
		frameRate: 10,
		repeat: -1
	});
}

function createObject(game) {
	gameObject.platforms = game.physics.add.staticGroup();
	gameObject.platforms.create(400, 568, 'ground').setScale(2).refreshBody();
	gameObject.platforms.create(600, 400, 'ground');
	gameObject.platforms.create(50, 250, 'ground');
	gameObject.platforms.create(750, 220, 'ground');


	gameObject.player = game.physics.add.sprite(100, 450, 'dude');
	gameObject.player.setBounce(0.2);
	gameObject.player.setCollideWorldBounds(true);
	gameObject.player.body.setGravityY(800);


	gameObject.stars = game.physics.add.group({
		key: 'star',
		repeat: 11,
		setXY: {x: 12, y: 0, stepX: 70}
	});

	gameObject.stars.children.iterate(function (child) {
		//child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
		child.y = Phaser.Math.Between(70, 520);
	});

	gameObject.scoreText = game.add.text(16, 16, '', {fontSize: '32px', fill: '#fff', textAlign: 'center'});


	gameObject.bombs = game.physics.add.group();
}

function createColli(game) {
	game.physics.add.collider(gameObject.player, gameObject.platforms);

	game.physics.add.collider(gameObject.stars, gameObject.platforms);

	game.physics.add.overlap(gameObject.player, gameObject.stars, collectStar, null, game);

	game.physics.add.collider(gameObject.bombs, gameObject.platforms);

	game.physics.add.collider(gameObject.player, gameObject.bombs, hitBomb, null, game);
}

function createCursors(game) {
	gameObject.cursors = game.input.keyboard.createCursorKeys();
	gameObject.speedUpKey = game.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

	gameObject.stopKey = game.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
	game.input.keyboard.on('keydown_ENTER',function () {
		if(gameObject.game.stopped){
			//开始游戏
			game.scene.resume();
			gameObject.game.stopped = false;
		}else{
			//暂停游戏
			game.scene.pause();
			gameObject.game.stopped = true;
		}
	},game);
}

function collectStar(player, star) {
	star.disableBody(true, true);
	gameObject.score += 10;
	gameObject.scoreText.setText(gameObject.score);
	gameObject.sounds.starCollect.play();

	if (gameObject.stars.countActive(true) === 0) {
		gameObject.stars.children.iterate(function (child) {
			child.enableBody(true, child.x, Phaser.Math.Between(70, 520), true, true);
		});

		var x = (gameObject.player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

		var bomb = gameObject.bombs.create(x, 16, 'bomb');
		bomb.setBounce(1);
		bomb.setCollideWorldBounds(true);
		bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
		bomb.allowGravity = false;
	}
}

function hitBomb() {
	this.sound.stopAll();
	this.physics.pause();
	gameObject.player.setTint(0xff0000);
	gameObject.player.anims.play('turn');
	gameObject.game.gameOver = true;
	gameObject.sounds.explosion.play();
}