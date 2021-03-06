/*global jQuery, $, document, Recaptcha, JSON */
// a simple list of properties in English is good enough for now
var dictionary = {
	conflict: "Already in use",
	reserved: "Reserved word",
	invalidemail: "Invalid email",
	minpasslength: "Must be at least 8 characters",
	passwordminpasslength: "Must be at least 8 characters",
	accepttos: "You must accept the Terms of Service",
	recaptchainvalid: "Invalid Recaptcha"
};

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
	  if (typeof(msg) === "string") {
			msg = dictionary[msg] || "Uh oh, we had an error!";
		} else {
			// extract the message
			msg = msg.message || "Error";
			// if it is a string, then present as is; if it is an array, take the parts
			if (typeof(msg) !== "string") {
				tmp = [];
				$.each(msg,function(i,m) {
					$.each(m,function(key,val){
						tmp.push(dictionary[key+val] || dictionary[val] || val);
					});
				});
				msg = tmp.join(", ");
			}
	  }
	  error.attr("langkey",msg).text(dictionary[msg] || msg).css("display","inline");
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
			}).always(function(){
				checkButton();
			});
		} else {
			input.removeClass("valid invalid");
			error.text("").hide();
			checkButton();
		}
	});
	$("div#register-step-1 input:button").bind("click",function(){
		// move to the next step if no required are unfilled
		var step = $(this).closest("div.register-step"), nextStep = step.next("div.register-step"),
		form = $(this).closest("form"), unfilled = form.find('div#register-step-1 input.required').filter(function(){
			return($(this).val()==="");
		}).length;
		if (unfilled <= 0) {
			step.hide("fast");
			nextStep.show("fast");
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
		var form = $(this).closest("form"), step = $(this).closest("div.register-step"), nextStep = step.next("div.register-step"),
		error = $(this).closest("div").find("div.error");
		$.ajax({
			contentType: "application/json", method:"POST",
			url:"/api/user",datatype:"json", data:json.stringify(form.serializeHash())
		}).then(function(data,status,xhr){
			$("p#register-message").text("Registration is almost complete! Please check your inbox to confirm your email, and you are ready to go!");
			step.hide("fast");
			nextStep.show("fast");
		}).fail(function(jqxhr,status,err){
			// report the error message
			// depends what the error is
			var data = jqxhr.status === 404 || jqxhr.status === 0 ? "Server error" : jqxhr.responseText;
			showError(data,error);
		});
			
	});
		

	// validate recaptcha/accept TOS when exit them - when all validated, move on
	// final start over
	$("input#start-again-button").click(function(){
		var form = $(this).closest("form");
		// clear fields
		form.find("input.text").each(function(i,input){
			$(input).val("").removeClass("valid invalid").parent().find("div.error").text("").hide();
		});
		form.find("input[type=checkbox]").removeAttr("checked");
		// reset the recaptcha WITHOUT focusing it
		Recaptcha.reload("t");
		// slide back to first stage
		form.find("div.register-step").each(function (i,d) {
			d = $(d);
			if (d.is(":visible")) {
				d.hide("fast");
			}
		});
		form.find("div.register-step:first").show("fast");
	});
	
	
	// clear the fields on entry
	$("form#main-register-form input[type=text]").val("");
	$("form#main-register-form input[type=password]").val("");
	$("form#main-register-form input[type=checkbox]").removeAttr("checked");
	$("form#main-register-form input[type=button]:not(#start-again-button)").attr("disabled","disabled");
}); 
