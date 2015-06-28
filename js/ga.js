/*jslint */
/*global document */

/*
 * Need to be intelligent and differentiate beta from prod
 */
var gaConfig = {
	'www.studymesh.com': {account:'UA-39351567-1',domain:'studymesh.com'},
	'studymesh-beta.herokuapp.com': {account:'UA-39351567-2',domain:'herokuapp.com'}
}, myConfig = gaConfig[document.location.hostname];

if (myConfig) {
	var _gaq = _gaq || [];
	_gaq.push(['_setAccount', myConfig.account]);
	_gaq.push(['_setDomainName', myConfig.domain]);
	_gaq.push(['_trackPageview']);

	(function() {
	  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	  ga.src = ('https:' === document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
	  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
	}());
}
