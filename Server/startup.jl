
# Load our website project into Julia
cd(@__DIR__)
using Pkg
Pkg.activate(".")

# Make sure that we have all needed packages
Pkg.instantiate()

using Genie

# Load our website project into Genie
Genie.loadapp(".")

# Launch server
if ENV["GENIE_ENV"]=="dev"
    Genie.up()
else
    Genie.up(async=false)
end

# Genie.WebChannels.broadcast("___", "Hey!") # use this to send to a channel

# Genie.WebChannels.broadcast("/test", "Hey!") # use this to send to a channel