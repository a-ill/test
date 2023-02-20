module BasicController

using Genie, Genie.Renderer, Genie.Renderer.Html, Genie.Requests
using JSON3

function landing()
    html(:basic,:landing, layout = :main, context = @__MODULE__)
end


end