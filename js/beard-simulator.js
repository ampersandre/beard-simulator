(function ($) {
    var bsHtml = '<div class="bs-buttons">'+
            '<span class="bs-button bs-upload green">Choose Photo<input class="bs-file" type="file"/></span>'+
            '<button class="bs-button bs-webcam green">Webcam</button>'+
            '<select class="bs-button bs-accessory bs-prompt" disabled><option value="">Choose Accessory &raquo;</option></select>'+
            '<button class="bs-button bs-facebook blue" disabled><img src="images/icons/facebook.png"/></button>'+
            '<button class="bs-button bs-save yellow" disabled><img src="images/icons/save.png"/></button>'+
        '</div>'+
        '<div class="bs-screen">'+
	        '<div class="bs-instructions-container">'+
	            '<div class="bs-instructions">Upload a picture or use your webcam to begin!</div>'+
	        '</div>'+
	        '<div class="bs-loading" style="display: none;"><img src="images/ajax.gif"/></div>'+
	        '<div class="bs-canvas-container" style="display: none;">'+
	            '<div class="bs-webcam-screen"></div>'+
	            '<canvas class="bs-canvas"></canvas>'+
	        '</div>'+
        '</div>';

    $.fn.beardSimulator = function (options) {
        var settings = $.extend({
            width: 460,
            accessories: [],
            onUnsupported: function () {}
        }, options);
        var supported = (function(undefined) {return window.FileReader && $("<input type='file'>").get(0).files !== undefined;})();
		var isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1;
		
		var mode;
        return this.each(function () {
            if (!supported) { settings.onUnsupported(); return; }
            var container = $(this).addClass('bs').append(bsHtml);
            var webcamScreenId = 'screen-'+Math.floor(Math.random()*10000);
            container.find('.bs-webcam-screen').attr('id',webcamScreenId);
            var loading = container.find('.bs-loading');
            var c = container.find('canvas')[0];
            var canvas = new fabric.Canvas(c).setWidth(settings.width);
            canvas.selection = false;
            var images = { };
            
            function redraw() {
                container.find('.bs-instructions-container').hide();
                canvas.clear();
                
                if(images.base) {
                    canvas.setHeight(images.base.height * images.base.scaleY);
                    canvas.add(images.base);
                } else { canvas.setHeight(settings.width * 0.75); }
                
                if (images.accessory) { canvas.add(images.accessory); }
                
                canvas.renderAll()
                canvas.calcOffset();
                container.find('.bs-canvas-container').show();
                loading.hide();
            }
            
            function setAccessory(url) {
            	if (!url) { images.accessory = null; return; }
            	fabric.Image.fromURL(url, function(img){
	            	images.accessory = img;
	            	images.accessory.scaleToWidth(settings.width/2);
	                images.accessory.set({
	                    top:canvas.height/2 - images.accessory.height*images.accessory.scaleY/2,
	                    left:settings.width/2 - images.accessory.width*images.accessory.scaleX/2,
	                    borderColor: '#FFF',
	                    cornerColor: '#FFF',
	                    cornerSize: 12,
	                    transparentCorners: true
	                });
	                if (isAndroid) { images.accessory.set({ cornerSize: 24 }); }
	                redraw();
	            });
            }
            
            var accessorySelect = container.find('.bs-accessory');
            for (var i = 0; i < settings.accessories.length; i++) {
            	accessorySelect.append('<option value="'+settings.accessories[i].url+'">'+settings.accessories[i].text+'</option>');
            }
            accessorySelect.change(function() {
            	accessorySelect.removeClass('bs-prompt');
            	setAccessory(this.value);
            }).click(function() {
            	accessorySelect.removeClass('bs-prompt');
            });
            
            container.find('.bs-file').change(function(fileEvent) {
                var file = fileEvent.target.files[0], imageType = /image.*/;
                if (!file.type.match(imageType)) { return; }
                
                container.find('.bs-webcam-screen').hide();
                loading.show();
                var fr = new FileReader();
                fr.onload = function() {
                    fabric.Image.fromURL(fr.result, function(img){
                        images.base = img;
                        img.scaleToWidth(settings.width).set({evented: false, hasControls: false, selectable: false});
                        redraw();
                    });
                    container.find('.bs-button').removeAttr('disabled');
                };
                fr.readAsDataURL(file);
            });
            
            var sayCheese;
            if (isAndroid) { container.find('.bs-webcam').remove(); }
            else {
	            container.find('.bs-webcam').click(function() {
	            	container.find('.bs-file').val('');
	            	if (!sayCheese) {
	                    sayCheese = new SayCheese('#'+webcamScreenId, {audio:false});
	                    console.log(sayCheese);
	                    sayCheese.on('start', function() {
	                        images.base = null;
	                        redraw();
	                        container.find('.bs-webcam-screen').show();
	                        container.find('.bs-button').removeAttr('disabled');
	                        console.log(sayCheese);
	                    });
	                    
	                    sayCheese.on('snapshot', function(snapshot) {
	                        var snapshotUrl = snapshot.toDataURL('image/png');
	                        fabric.Image.fromURL(snapshotUrl, function(img){
	                        	images.base = img;
		                        img.set({evented: false, hasControls: false, selectable: false, flipX: true});
		                        redraw();
		                        if (sayCheese.action == 'facebook') {
		                        	shareFacebook();
		                        } else if (sayCheese.action == 'save') {
		                        	savePicture();
		                        }
		                        images.base = null;
		                        redraw();
	                        });
	                    });
	                    sayCheese.start();
	                } else {
	                	images.base = null;
	                    redraw();
	                    container.find('.bs-webcam-screen').show();
	                }
	            });
	        }
            
            function savePicture() {
            	window.open(canvas.toDataURL(), '_blank', 'width='+canvas.width+',height='+canvas.height);
            }
            function shareFacebook() {
            	postCanvasToFacebook(canvas.toDataURL(), 'test', function() { alert('Posted to Facebook!'); });
            }
            container.find('.bs-facebook').click(function() {
                canvas.deactivateAllWithDispatch().renderAll();
                if (images.base) {
                	shareFacebook();
                } else {
                	sayCheese.action = 'facebook';
                	sayCheese.takeSnapshot(canvas.width, canvas.height);
                }
            });
            container.find('.bs-save').click(function() {
            	canvas.deactivateAllWithDispatch().renderAll();
                if (images.base) {
                    savePicture();
                } else {
                	sayCheese.action = 'save';
                    sayCheese.takeSnapshot(canvas.width, canvas.height);
                }
            });
        });
    }
}(jQuery));
