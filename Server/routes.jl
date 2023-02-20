
using Genie.Router, Genie.Requests, Genie.Assets
using Server.BasicController

Genie.config.websockets_server = true

#---Basic-----------------------------------------------------------

route("/", BasicController.landing, named = :landing)

Assets.channels_support("___")

# Uncomment this to test
#=
Assets.channels_support("/test")
channel("/test", () -> "")
=#