/*
 * jQuery Rotator Plugin
 *
 * @author: Jonathan Brumley <cayasso@gmail.com>
 */
 
/**
 * <p>The Rotator Plug-In is a simple slideshow plugin that enable rotation in between 
 * two or more elements including images, divs, anchors, etc. It also has an API that 
 * allows the fallowing functions: stop, play, next, prev, jump and index, this funtions 
 * allow controlling the cycleling options from an anchor, button or any other element.</p>
 * 
 * <p>The plugin provides a method called rotator which is invoked on a container 
 * element. Each child element of the container becomes 
 * a "slide". Options control how and when the slides are transitioned. </p>
 *
 * <strong>Quick example:</strong> 
 * <pre>$('#myDivContainer').rotator();</pre> 
 *
 * @module rotator
 * @requires jquery
 */
(function ($) {

	/**
	 * <p>This class enables rotation in between two or more elements including images, 
	 * divs, anchors, etc.</p>
	 *
	 * <strong>Usage example:</strong>
	 * <pre>$('#myDiv').rotator({speed: 1500, delay: 2000});</pre> 
	 * <p>This will enable rotation for the child elements in a div with id "myDiv" 
	 * with a 1500 millisecond transition speed and 2000 milliseconds delay.</p>
	 *
	 * @class fn.rotator
	 * @constructor
	 * @param options {Object} (Optional) An object containing one or more global options
	 * @return {Object} jQuery object that can be used for chaning.
	 */
    $.fn.rotator = function (options) {
        
		// Check if there are elements, if not just return
		if (!this.length) {        
			return this;
		}

		// Wrap the rotator internal function in the public function
        return new rotator(this, options);
    };
	
    // ROTATOR
    var rotator = function (e, options) {
			
		var 

		// Default public values			
		defaults = {
			
			/**
			 * Rotation delay time
			 *
			 * @public
			 * @property delay
			 * @type Number
			 * @default 5000
			 */
			delay: 5000,
							
			/**
			 * Transition speed
			 *
			 * @public
			 * @property speed
			 * @type Number
			 * @default 1000
			 */
			speed: 1000,
			
			/**
			 * Start cycleling, if false it wouldnt cycle
			 *
			 * @public
			 * @property cycle
			 * @type Boolean
			 * @default true
			 */
			cycle: true,
			
			/**
			 * The starting rotation slide
			 *
			 * @public
			 * @property start_index
			 * @type Number
			 * @default 0
			 */
			start_index: 0,
			
			/**
			 * Number rotation cycles
			 *
			 * @public
			 * @property cycles
			 * @type Number
			 * @default 6
			 */
			cycles: 0,
			
			/**
			 * end cycle frame
			 *
			 * @public
			 * @property cycle_end_index
			 * @type Number
			 * @default 0
			 */
			cycle_end_index: 0
        },
					
	// These are private variables
	
		// Get the main element childrens
        $e = $(e),
		
		//set element childs
		$childs = $(e).children(),
		
		// Initialize next index value
        next_index = null,
		
		// Rotation timer
        timer, 
		
		// Children elements length
		length = $e.length,
		
		// Initialize the slide index
        index = null,
		
		loops = 0,
		
		// Define interval variable
        interval,
		
		// Quick initial play delay
		quickPlayDelay,
					
		// Flag
		flag = true,
		
		// Is playing
		isPlaying = false,
		
		// Default events
		events = {'transition': function(){}, 'cycleEnd': function(){}},
		
		// Get options based on user options or defaults
    	o = $.extend({}, defaults, options)
		
			
								
		($childs.length) && ($e = $childs)
					
		// If only one child element exit with return, there is nothing to rotate;
		if ($e.length < 2) return e;
		
		next_index = (o.start_index === 0) ? null : o.start_index;
		
		var cycles = o.cycles * $e.length;
			
        $e.css('position', 'absolute').hide().parent().css('position', 'relative');

		// Show the start index slide
		$e.eq(o.start_index).show();
		
		// Run go for first time
		go();
		
		/**
		 * <p>This method returns the rotator API functions, that allow to interact with 
		 * the rotator by using api functions attached to an element event. </p>
		 *
		 * <strong>Usage example 1:</strong>
		 * <pre>var api = $('#myDiv').rotator().data('rotator');
		 * <br> $('a.playLink').click(function(){api.jump(2).play()}); </pre>
		 * <p>This will jump to slice 2 and then start playing the rotation when cliking 
		 * on the playLink.</p>
		 *
		 * <strong>Usage example 2:</strong> 
		 * <pre>$('#myDiv').rotator().data('rotator').stop();</pre> 
		 * This will stop the rotation from continue playing.
		 *
		 * @class data
		 * @constructor
		 * @param rotator {String} You need to use "rotator" as the string for this to work. 
		 * @return {Object} Instance of rotator API
		 */
		function api () {						
			$(e).data('rotator', obj);
		}
		
		/**
		 * Stop the rotation.
		 * @public
		 * @method stop
		 * @return {Object}
		 */
		this.stop = function() {			
			clearTimeout(interval);
			clearTimeout(quickPlayDelay);
			$e.stop();
			isPlaying = false;
			loops = 0;
			return this;
		};
		
		/**
		 * Bind events to the rotator.
		 * @public
		 * @method bind
		 * @param event {String} Event name to bind, supported events are [transition].
		 * @param fn {Function} Call back function.
		 * @return {Object}
		 */
		this.bind = function(event, fn) {			
			if (events[event])
				events[event] = fn;
			return this;
		};
		
		/**
		 * Jump to another slide.
		 * @public
		 * @method jump
		 * @param num {Number} Index of the slide to jump to.
		 * @return {Void}
		 */
		this.jump = function (num) { 
			//if (num) { flag = true; }
			obj.stop();
			go(num);
			return this;
		};
		
		/**
		 * Start the rotation.
		 * @public
		 * @method play
		 * @param reverse {Boolean} Start rotation in reverse order if set to true.
		 * @return {Object}
		 */
		this.play = function (reverse) {
			
			if (!isPlaying) {
			
				isPlaying = true;
				
				reverse = reverse || false;
							
				if (next_index === null) {
					next_index = 0;
				}
				
				quickPlayDelay = setTimeout(function(){								
					(function looping(){	

						if ( cycles && loops >= cycles && next_index == o.cycle_end_index ) {										
							obj.stop();
							loops = 0;							
							events['cycleEnd'](this, index);				
							return false;
						}else{
							go(next_index, reverse, true);
							loops++;
							interval = setTimeout(looping, o.delay);	
						}
									
					})();								
				}, o.delay);		
			}
			return this;
		};
		
		/**
		 * Jump to the previous slide.
		 * @public
		 * @method prev
		 * @return {Object}
		 */
		this.prev = function () {
			obj.stop();
			go(next_index, true);
			return this;
		};
		
		/**
		 * Jump to the next slide.
		 * @public
		 * @method next
		 * @return {Object}
		 */
		this.next = function () {
			obj.jump();
			return this;
		};
		
		var obj = this;
		
		// If cycle is on play
		o.cycle && obj.play();
				
		/**
		 * Calculate the next index to jump to.
		 * @private
		 * @method calculate
		 * @param reverse {Boolean} Run in reverse if true.
		 * @return {Void}
		 */
		function calculate (reverse) {
			reverse = reverse || false;
	
			// If reverse is true rotate in reverse order
			if (reverse === true) {
				next_index--;
				if (next_index < 0) {
					next_index = length - 1;
				}
			} else {
				
				isPlaying && next_index++;
				
				if (next_index == length) {
					next_index = 0;
				}				
			}
		}
		 
		/**
		 * Execute the animation.
		 * @private
		 * @method go
		 * @param custom_index {Number} Custom indext to jump to.
		 * @param play_reverse {Boolean} Animate in reverse order if true,
		 * @return {Void}
		 */
		function go (custom_index, play_reverse) {
								
			next_index = (typeof custom_index === 'number') ? custom_index : next_index;
			
			(flag !== true) && calculate(play_reverse);

			if (next_index != index) {
				$e.eq(next_index).css('z-index', 1).fadeTo(o.speed, 1);
				$e.eq(index).css('z-index', 0).animate({
					opacity: 0
				}, o.speed, function(){ events['transition'](this, index) });
				index = next_index;
			}
			
			flag = false;
		}	
		
		// Set the api
		api();
		
		// Return the main object
        return e;
    };

})(jQuery);
