function vh_to_rem() 
    cd(@__DIR__)
    rem_ratio = 1092/100/16
    files = readdir(@__DIR__)
    deleteat!(files,findfirst(files.=="vhtorem.jl"))
    inds_dirs = findall(isdir.(files))
    if !isempty(inds_dirs)
        deleteat!(files,inds_dirs)
    end
    for file in files
        svelte = false
        go = true
        if occursin("svelte", file)
            svelte = true
            go = false
        end
        css = open(file) do f
            read(f, String)
        end
        split_css = split(css, "\r\n")
        for k = 1:lastindex(split_css)
            css_fragment = split_css[k]
            if svelte 
                if go!=true
                    if occursin("<style>",css_fragment)
                        go = true
                    end
                    continue
                end
            end
            if occursin("vh", css_fragment)
                split_css_fragment = split(css_fragment, " ")
                for i=1:lastindex(split_css_fragment)
                    fr = split_css_fragment[i]
                    if occursin("vh", fr)
                        fr_last = split(fr, "vh")
                        fr_last2 = split(fr_last[1], "(")
                        num = parse(Float64,fr_last2[end])
                        num = round(num*rem_ratio,digits=3)
                        fr_last2[end] = string(num)
                        if length(fr_last2)>1
                            fr_last[1] = join(fr_last2,"(")
                        else
                            fr_last[1] = fr_last2[1]
                        end
                        split_css_fragment[i] = join(fr_last,"rem")
                    end
                end
                split_css[k] = join(split_css_fragment," ")
            end
        end
        new_css = join(split_css, "\r\n")
        if css!=new_css
            open(file, "w") do io
                write(io, new_css)
            end
        end
    end
end

vh_to_rem()