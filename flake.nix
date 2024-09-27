{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs =
    { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [
            (final: prev: {
              nodejs = prev.nodejs_20;
            })
          ];
        };
        inherit (pkgs) lib;

        inherit (builtins) fromJSON readFile;
        package = fromJSON (readFile ./package.json);
      in
      {
        packages.default = pkgs.buildNpmPackage {
          pname = package.name;
          inherit (package) version;
          src = ./.;
          npmDepsHash = "";
          meta = {
            inherit (package) description homepage;
            license = lib.licenses.bsd3;
          };
        };
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs
            nixfmt-rfc-style
          ];
        };
      }
    );
}
