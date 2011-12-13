chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) {

		console.log("Heard: " + request.action + "... Responding...");
        if (request.app == "chromeglance")
    		if (request.action == "countMe")
    		{
    			chrome.extension.sendRequest({action:"XcountMe",app:"chromeglance"});
    		}
    		else if (request.action == "getMeData")
    		{
    			var mydata = null;
    			if ($("embed[type='application/pdf']").length == 1)
    			{
    			    chrome.extension.sendRequest({action:"XgetMeData",data:null,app:"chromeglance"});
    				return;
    			}
    			$('html').each(function() {
    				if (mydata == null)
    					mydata = "";
    				mydata = mydata + $(this).html();
    			});
    
    			sendResponse({});
    			chrome.extension.sendRequest({action:"XgetMeData",data: '<html>' + mydata + '</html>',app:"chromeglance"});
    		}
    		else if (request.action == "go")
    		{
    			sendResponse({});
    			chrome.extension.sendRequest({action:"Xgo",url:request.url,app:"chromeglance"});
    		}
});
