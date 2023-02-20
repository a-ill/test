using Pkg

cd(@__DIR__)
cd("..")

Pkg.activate(".")
Pkg.instantiate()

using SearchLight, SearchLightPostgreSQL

#Connect to the database
SearchLight.Configuration.load() |> SearchLight.connect

# Initialize the database for Julia
SearchLight.Migrations.create_migrations_table()

#DEBUG remove all tables
#SearchLight.Migration.all_down!!()
#DEBUG

#Load all tables and print status
SearchLight.Migration.all_up!!()
SearchLight.Migration.status()


#---Initialize Genie Authorization----------------------------------------------------

using GenieAuthorisation
using GenieAuthorisation: findone_or_create, save!, findone

# Create roles
for r in ["free", "unconfirmed"]
    findone_or_create(Role, name = r) |> save!
end

# Create permissions
for p in ["confirmed"]
    findone_or_create(Permission, name = p) |> save!
end

assign_permission(findone(Role, name = "free"), findone(Permission, name = "confirmed"))