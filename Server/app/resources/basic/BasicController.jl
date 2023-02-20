module BasicController

using Genie, Genie.Renderer, Genie.Renderer.Html, Genie.Requests
using JSON3

function landing()
    html(:basic,:default, layout = :main, context = @__MODULE__)
end

function test()
    html(:basic,:test, layout = :main, context = @__MODULE__)
end

end