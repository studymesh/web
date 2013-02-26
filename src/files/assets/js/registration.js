/*global jQuery, $, document, Recaptcha, JSON */
$(document).ready(function() {
	var step2handler, showError, json;

	$.fn.serializeHash = function() {
		var hash = {};
		this.find(":input").each(function(i,elm){
			var name = $(elm).attr("name");
			if (name) {
				hash[name] = $(elm).val();
			}
		});
		return(hash);
	};
	
	/*global define */
  json = {
    parse: function(json) {
      var data;
      switch(typeof(json)) {
        case "string":
          try {
            data = JSON.parse(json);
          } catch (e) {
            data = json;
          }
          break;
        case "object":
          data = json;
          break;
        default:
          data = null;
      }
      return(data);
    },
    stringify: function(json) {
      var data;
      switch(typeof(json)) {
        case "object":
          try {
            data = JSON.stringify(json);
          } catch (e) {
            data = null;
          }
          break;
        case "string":
          data = json;
          break;
        default:
          data = null;
      }
      return(data);
    }
  };
	

	showError = function(e,error,form) {
	  // the error should be either a text message, which we show, or an object, which shows multiple
	  var msg = json.parse(e), tmp;
	  if (typeof(msg) !== "string") {
			// extract the message
			msg = e.message || "Error";
			// if it is a string, then present as is; if it is an array, take the parts
			if (typeof(msg) !== "string") {
				tmp = [];
				$.each(msg,function(i,m) {
					if (m && m.password) {
						tmp.push(m.password);
					}
				});
				msg = tmp.join(", ");
			}
	  }
	  //error.attr("langkey",msg).i18n().removeClass("status-inactive").addClass("status-active").show();
	  error.attr("langkey",msg).text(msg).css("display","inline");
	};
	
	// validate all fields when exit them - when all validated, enable button
	$("div#register-step-1 input.text").blur(function(){
		var invalid = 1, input = $(this), val = input.val() || "", validator = input.attr("validation") || "",
		div = input.closest("div"), button = div.find("input.button"), error = input.parent().find("div.error"), checkButton;
			
		checkButton = function() {
			// then enable or disable button
			if (invalid > 0) {
				button.attr("disabled","disabled");
			} else {
				button.removeAttr("disabled");
			}
		};
			
		// check all required fields that they are OK
		div.find("input.required").each(function(i,input){
			input = $(input);
			// is it filled in?
			if (input.val() === null || input.val() === undefined || input.val().replace(/\s+/g,"") === "") {
				invalid++;
			}
		});
		// validate this field if required
		if (val.replace(/\s+/g,"") !== "" && validator !== "") {
			// check for validation
			$.get(validator+val).done(function(data,status,xhr){
				input.addClass("valid").removeClass("invalid");
				error.text("").hide();
				invalid--;
			}).fail(function(jqxhr,status,err){
				var data = "";
				input.addClass("invalid").removeClass("valid");
				// depends what the error is
				data = jqxhr.status === 404 || jqxhr.status === 0 ? "Server error" : jqxhr.responseText;
				showError(data,error);
				//error.text(data).css("display","inline");
			}).always(function(){
				checkButton();
			});
		} else {
			input.removeClass("valid invalid");
			error.text("").hide();
			checkButton();
		}
	});
	step2handler = function(){
		var div = $(this).closest("div"), button = div.find("input.button"), invalid = false;
		// check that all checkboxes are checked, and all input text fields are non-blank
		div.find("input:checkbox").each(function(i,input){
			if (!$(input).is(":checked")) {
				invalid = true;
			}
		});
		div.find("input:text").each(function(i,input){
			if (($(input).val()||"").replace(/\s+/g,"") === "") {
				invalid = true;
			}
		});
		// then enable or disable button
		if (invalid > 0) {
			button.attr("disabled","disabled");
		} else {
			button.removeAttr("disabled");
		}
	};

	$("div#register-step-2 input:checkbox").bind("click",step2handler);
	$("div#register-step-2 input:text").bind("blur",step2handler);
	$("div#register-step-2 input:button").bind("click",function(){
		// submit the registration
		var form = $(this).closest("form");
		$.ajax({
			contentType: "application/json", method:"POST",
			url:"/api/user",datatype:"json", data:json.stringify(form.serializeHash())
		}).then(function(data,status,xhr){
			$("p#register-message").text("Registration is almost complete! Please check your inbox to confirm your email, and you are ready to go!");
		}).fail(function(jqxhr,status,err){
			$("p#register-message").text("Unknown error");
		}).always(function(){
			$("div.sliding-panels").css("margin-left",-1000);
		});
			
	});
		

	// validate recaptcha/accept TOS when exit them - when all validated, move on
	// final start over
	$("input#start-again-button").click(function(){
		// clear fields
		$("form#main-register-form input.text").each(function(i,input){
			$(input).val("").removeClass("valid invalid").parent().find("div.error").text("").hide();
		});
		$("form#main-register-form input[type=checkbox]").removeAttr("checked");
		// reset the recaptcha WITHOUT focusing it
		Recaptcha.reload("t");
		// slide back to first stage
		$("div.sliding-panels").css("margin-left",0);
	});
	// enable slide forward-backward
		
}); 
