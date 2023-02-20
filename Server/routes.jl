
using Genie.Router, Genie.Requests, Genie.Assets
using Server.BasicController

Genie.config.websockets_server = true

#---Basic-----------------------------------------------------------

route("/", BasicController.landing)

route("/test", BasicController.test)

Assets.channels_support("___")

Assets.channels_support("/test")
channel("/test", () -> "")
