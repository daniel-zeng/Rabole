function prnt(txt){
    console.log(txt);
}

function init() {
    var enabled = null
        chrome.storage.local.get("enabled", function (result) {
            enabled = result.enabled;
            // prnt(enabled);
            if (enabled) {
                document.getElementById('enabled').checked = true;
            }
        });
        

        
        // Event listener for checkbox
        document.getElementById('enabled').addEventListener('click',
            function() {
                var checked = document.getElementById('enabled').checked;
                chrome.storage.local.set({'enabled': checked});
            });
    }

document.addEventListener('DOMContentLoaded', init);